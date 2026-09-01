# Architecture — SocialPage

## System Overview

SocialPage is a two-service web application: a React SPA (single-page application) talking to a stateless Express REST API over HTTP. There is no server-side rendering and no shared session state — every protected request carries its own JWT token.

```
┌──────────────────────┐      HTTPS (JSON / multipart)      ┌──────────────────────┐
│                      │ ──────────────────────────────────▶ │                      │
│   React SPA (Vite)   │                                     │   Express REST API   │
│   frontend/          │ ◀────────────────────────────────── │   backend/           │
│                      │                                     │                      │
└──────────────────────┘                                     └──────────┬───────────┘
                                                                        │
                                                        ┌───────────────┼───────────────┐
                                                        ▼                               ▼
                                               ┌────────────────┐             ┌────────────────┐
                                               │  MongoDB Atlas  │             │   Cloudinary   │
                                               │  (users, posts) │             │  (post images) │
                                               └────────────────┘             └────────────────┘
```

---

## Data Model

Two collections only (per the task's 2-collection constraint). Everything else is embedded.

### `users` collection

**File:** `backend/src/models/User.ts`

| Field | Type | Notes |
|-------|------|-------|
| `username` | String | Unique |
| `email` | String | Unique |
| `password` | String | Bcrypt hash (12 salt rounds) |
| `refreshToken` | String \| null | Bcrypt hash of the current refresh token; `select: false` (excluded unless explicitly requested) |
| `createdAt` | Date | Auto-generated |

- Password and refresh-token hashing both run in a single Mongoose `pre('save')` hook — callers never hash manually.
- Storing only a hash of the refresh token means a leaked database dump can't be replayed as a valid refresh token.

### `posts` collection

**File:** `backend/src/models/Post.ts`

| Field | Type | Notes |
|-------|------|-------|
| `author` | ObjectId (ref → User) | Who created the post |
| `authorUsername` | String | Denormalized — feed never needs a `populate()` |
| `text` | String (optional) | Post text content |
| `imageUrl` | String (optional) | Cloudinary URL |
| `imagePublicId` | String (optional) | Cloudinary public ID |
| `likes` | Array of `{ user, username, createdAt }` | Embedded, one entry per user, toggled |
| `comments` | Array of `{ user, username, text, createdAt }` | Embedded, append-only |
| `createdAt` | Date | Auto-generated |

- A `pre('validate')` hook rejects a post with neither text nor image.
- Embedding likes/comments means "who liked/commented" never needs a join — the username is stored directly on the entry.
- Tradeoff: post document grows with engagement. Acceptable at this app's scale.

### Indexes

| Index | Purpose |
|-------|---------|
| `{ author: 1, _id: -1 }` | Profile "my posts" query |
| `{ 'likes.user': 1 }` | Profile "liked posts" query |
| `{ 'comments.user': 1 }` | Profile "commented posts" query |
| `_id` (default) | Feed cursor pagination (already unique + ordered) |

---

## Request Flows

### Authentication

Access/refresh token pair, not a single long-lived JWT:

```
Client                           Server
  │                                 │
  ├── POST /api/auth/register ────▶ │  Create user, hash password
  │   { username, email, password } │  Sign access + refresh JWTs
  │                                 │  Store bcrypt(refreshToken) on user
  │◀── { accessToken,               │
  │      refreshToken, user } ───── │
  │                                 │
  │  Persist both tokens            │
  │  Attach accessToken as          │
  │  Authorization header           │
```

- `POST /api/auth/register` and `/login` return `{ accessToken, refreshToken, user }`.
- **Access token** (`JWT_SECRET`, 15 min) is sent as `Authorization: Bearer <accessToken>` on every request; `requireAuth`/`optionalAuth` verify it and set `req.userId`.
- **Refresh token** (`JWT_REFRESH_SECRET`, 7 days) is opaque to the client beyond storage — its bcrypt hash is stored on the `User` document so it can be validated and revoked server-side.
- Frontend persists `{ accessToken, refreshToken, user }` as one JSON blob in `localStorage` via `AuthContext`; the axios instance (`api/client.ts`) keeps the access token in a default header via `setAuthTokens`.
- **Silent refresh:** an axios response interceptor watches for `401`s. On the first 401 for a given request (excluding `/api/auth/*` routes, and never retried twice), it calls `POST /api/auth/refresh` with the stored refresh token, gets back a **rotated** token pair, updates `AuthContext`/`localStorage`, and retries the original request once. Concurrent 401s share a single in-flight refresh via one cached promise so a burst of requests doesn't trigger a refresh storm.
- `POST /api/auth/refresh` verifies the refresh JWT, checks it against the stored hash (`compareRefreshToken`), then issues and persists a brand-new pair (rotation — the old refresh token can't be reused).
- `POST /api/auth/logout` verifies the refresh token and clears it from the user document, revoking it server-side; the frontend calls this best-effort on logout (a failure just means the token expires naturally later).
- If refresh itself fails (expired/revoked token), the frontend clears local auth state and the user is treated as logged out.
- No cookies, no server sessions for request auth — but unlike a pure single-JWT scheme, the server does hold enough state (the hashed refresh token) to revoke a session before it naturally expires.

### Feed Pagination

Uses **keyset (cursor) pagination**, not `skip/limit`:

```
Request:   GET /api/posts?cursor=<lastSeenPostId>&limit=10
Query:     { _id: { $lt: cursor } }  sorted  { _id: -1 }
Response:  { posts: [...], nextCursor: <lastPostId> | null }
```

**Why cursor pagination?**
- `skip(n)` is O(n) — MongoDB walks past all skipped documents
- Cursor is O(limit) per page — constant performance regardless of depth

`optionalAuth` middleware runs on this route: if a valid access token is present, `likedByMe` is computed per post; otherwise the feed is public with `likedByMe: false`.

Each serialized post also inlines its **last 3 comments** (`serializePost` in `post.controller.ts`) so the feed can show a comment preview with zero extra requests; `GET /api/posts/:id/comments` is only called when a user expands the full list.

### Image Upload Flow

```
Client                          Server                       Cloudinary
  │                                │                              │
  ├── POST /api/posts ───────────▶ │                              │
  │   (multipart/form-data)        │                              │
  │                                ├── upload_stream ───────────▶ │
  │                                │   (buffer from multer)       │
  │                                │◀── { secure_url, public_id } │
  │                                │                              │
  │                                │  Save post with imageUrl     │
  │◀── { post } ────────────────── │                              │
```

- `multer` buffers file in memory (no disk writes to keep the app stateless)
- `uploadBufferToCloudinary` streams the buffer to Cloudinary via `upload_stream`
- Only `secure_url` and `public_id` are stored on the post document
- The binary never touches MongoDB

### Like / Comment

Both are single-document updates followed by one `save()`:

- **Like:** `post.likes.push()` or `splice()` (toggle)
- **Comment:** `post.comments.push()` (append-only)

Response carries only what changed (`{ likesCount, likedByMe }` or `{ comment, commentsCount }`), so the frontend patches local state instead of refetching the feed — this is what makes interactions feel instant.

### Profile Data

`GET /api/posts/mine` runs three independent queries concurrently:

```javascript
const [posts, likedPosts, commentedPosts] = await Promise.all([
  Post.find({ author: userId }),        // index: { author: 1, _id: -1 }
  Post.find({ 'likes.user': userId }),  // index: { 'likes.user': 1 }
  Post.find({ 'comments.user': userId }) // index: { 'comments.user': 1 }
]);
```

`commentedPosts` entries carry `myComments` — the subset of comments written by the current user (filtered server-side, not client-side).

---

## Frontend Architecture

```
src/
├── context/AuthContext.tsx     ← Single source of truth for auth state
├── api/client.ts              ← Shared axios instance, token storage, silent-refresh interceptor
├── components/
│   ├── Navbar.tsx             ← Sticky top nav, user avatar, logout
│   ├── PostCard.tsx           ← Self-contained: owns like/comment state
│   ├── CreatePostCard.tsx     ← Text + image upload form
│   ├── ProtectedRoute.tsx     ← Redirect to /login if not authenticated
│   └── GlobalStyles.tsx       ← Shared keyframe animations (fade/float) injected via MUI
├── pages/
│   ├── LoginPage.tsx          ← Email/password form
│   ├── RegisterPage.tsx       ← Username/email/password form
│   ├── FeedPage.tsx           ← Paginated feed + create post
│   └── ProfilePage.tsx        ← Tabs: Posts / Liked / Comments
├── theme.ts                   ← MUI theme (SaaS light, indigo + pink)
└── types.ts                   ← TypeScript interfaces
```

**Key design choices:**

- **PostCard is self-contained** — it owns its own like/comment state and handles optimistic updates independently of the parent list. Both `FeedPage` and `ProfilePage` just render lists of these.
- **AuthContext** is the only source of truth for "am I logged in" — persists the access/refresh token pair and user to `localStorage`, exposes `login/register/logout`, and reacts to the axios client's refresh events (`setTokenRefreshHandlers`) to keep storage in sync when tokens rotate silently.
- **Single axios instance** — `setAuthTokens` is the only place the auth header gets set; the response interceptor owns silent refresh so no other code needs to think about token expiry.
- **SaaS Light Theme** — Clean white cards on soft off-white background, indigo primary accent, light pink secondary. Professional, minimal design using MUI theme overrides.

