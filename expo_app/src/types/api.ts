export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserRead {
  uuid: string;
  username: string;
  email: string | null;
  is_verified: boolean;
  karma: number;
  avatar_seed: string;
  phone_number: string | null;
  language: string | null;
  is_banned: boolean;
  permission_scope: string | null;
  created_at: string;
  is_deleted: boolean;
}

export interface PostRead {
  uuid: string;
  user_uuid: string;
  message: string;
  lat: number;
  lng: number;
  h3_l7: string;
  vote_count: number;
  comment_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  distance_from_user?: number;
}

export interface PostPage {
  posts: PostRead[];
  total_count: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CommentRead {
  uuid: string;
  user_uuid: string;
  post_uuid: string;
  message: string;
  lat: number;
  lng: number;
  h3_l7: string;
  vote_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentPage {
  comments: CommentRead[];
  total_count: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface VoteRead {
  uuid: string;
  user_uuid: string;
  target_type: "post" | "comment";
  target_uuid: string;
  vote_type: "upvote" | "downvote";
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
