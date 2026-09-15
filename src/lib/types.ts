export interface Profile {
  id: string;
  owner_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_username: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  body: string;
  created_at: string;
}

export interface FeedPost extends Post {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}
