# SocialPage — Intern Task

> A mini social-media web app where users sign up, post text/images, and like/comment on a public feed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) + TypeScript + Material UI v6 |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (Mongoose) — `users` and `posts` collections |
| Image Storage | Cloudinary |
| Auth | JWT (Bearer token) |

## Project Structure

```
├── backend/          Express REST API (TypeScript, ES modules)
│   └── src/
│       ├── controllers/    Route handlers (auth, posts)
│       ├── middleware/     Auth middleware (JWT verify)
│       ├── models/         Mongoose schemas (User, Post)
│       ├── routes/         Express routers
│       ├── schemas/        Zod validation schemas
│       ├── config/         DB & Cloudinary config
│       ├── utils/          Cloudinary upload helper
│       ├── types/          TypeScript type definitions
│       ├── app.ts          Express app setup
│       └── server.ts       Entry point
│
├── frontend/         React SPA (Vite, TypeScript)
│   └── src/
│       ├── pages/          LoginPage, RegisterPage, FeedPage, ProfilePage
│       ├── components/     Navbar, PostCard, CreatePostCard, ProtectedRoute, GlobalStyles
│       ├── context/        AuthContext (login state management)
│       ├── api/            Axios client with token interceptor
│       ├── utils/          Time formatting helper
│       ├── theme.ts        MUI theme (SaaS light theme)
│       ├── types.ts        Shared TypeScript interfaces
│       ├── App.tsx          Router setup
│       └── main.tsx        Entry point
│
└── docs/             Architecture documentation
```

## Features Implemented

- **User Authentication** — Register, login, JWT access/refresh tokens with silent refresh, protected routes
- **Create Posts** — Text and/or image upload (Cloudinary), at least one required
- **Public Feed** — Cursor-based pagination (keyset, not skip/limit), works for logged-out users too
- **Like/Unlike** — Toggle with optimistic UI update, instant feedback
- **Comments** — Add comments, lazy-load full comment list, inline display
- **Profile Page** — Tabbed view (My Posts / Liked / Commented) with counts
- **Responsive UI** — SaaS-style light theme (white, soft indigo, light pink accents)

## Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLOUDINARY_*
npm run dev
```

Runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev
```

Runs on `http://localhost:5173` by default.

Open the frontend URL, sign up, and start posting.

> **Note:** If the backend hangs on startup with no "MongoDB connected" log, your network's DNS may not resolve `mongodb+srv://` SRV records (common on campus/corporate networks). Add `DNS_SERVERS=8.8.8.8,1.1.1.1` to `backend/.env` to force public DNS.

## Environment Variables

### `backend/.env`

| Variable | Description |
|----------|-------------|
| `PORT` | Port the API listens on (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing access tokens (short-lived, 15m) |
| `JWT_REFRESH_SECRET` | Long random string for signing refresh tokens (long-lived, 7d) — must differ from `JWT_SECRET` |
| `CLIENT_URL` | Comma-separated allowed frontend origins (CORS) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

### `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the backend (e.g. `http://localhost:5000`) |

## API Endpoints

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | `{ username, email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/login` | — | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | — | `{ refreshToken }` → `{ accessToken, refreshToken }` (rotates refresh token) |
| POST | `/auth/logout` | — | `{ refreshToken }` → `204` (revokes the refresh token server-side) |
| GET | `/auth/me` | ✓ | Get current user |
| GET | `/posts?cursor=&limit=` | optional | Paginated public feed |
| POST | `/posts` | ✓ | Create post (multipart: `{ text?, image? }`) |
| GET | `/posts/mine` | ✓ | Profile data: `{ posts, likedPosts, commentedPosts }` |
| GET | `/posts/:id` | optional | Single post |
| GET | `/posts/:id/comments` | — | Full comment list for a post |
| POST | `/posts/:id/like` | ✓ | Toggle like → `{ likesCount, likedByMe }` |
| POST | `/posts/:id/comment` | ✓ | Add comment → `{ comment, commentsCount }` |

Protected routes expect `Authorization: Bearer <accessToken>`. When it expires, exchange the `refreshToken` via `/auth/refresh` for a new pair.

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Cursor pagination** | `_id: { $lt: cursor }` is O(limit) per page. `skip/limit` gets slower as you go deeper because MongoDB walks past skipped docs. |
| **Embedded likes/comments** | Per the task's 2-collection constraint. Each entry stores the username directly — no extra lookups needed for display. |
| **Bearer JWT (not cookies)** | Stateless authentication is simpler for an intern task and avoids cross-site cookie configuration. |
| **Access + refresh token pair** | 15-minute access tokens limit the damage of a leaked token; a 7-day refresh token (bcrypt-hashed on the `User` document) lets the frontend renew silently instead of forcing re-login. Axios auto-retries a 401 after refreshing once. |
| **Profile parallel queries** | `Promise.all` runs posts/liked/commented queries concurrently, each index-backed — no client-side filtering. |
| **Optimistic UI updates** | Like toggles instantly on click, reconciled with server response — makes interactions feel snappy. |
| **SaaS light theme** | Clean white + soft indigo/pink palette using MUI theme overrides. Professional look, good readability. |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed data model, request flows, and system design.
