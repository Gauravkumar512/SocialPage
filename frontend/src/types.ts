export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Comment {
  username: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: { id: string; username: string };
  text: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CommentedPost extends Post {
  myComments: Comment[];
}

export interface MyProfileResponse {
  posts: Post[];
  likedPosts: Post[];
  commentedPosts: CommentedPost[];
}
