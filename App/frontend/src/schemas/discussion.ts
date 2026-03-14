// Types describing anime discussion primitives used across the app

export interface Discussion {
  id: string;
  anime_id: number;
  category_id: string;
  created_by?: string; // NOTE: might remove
  title: string;
  body: string;
  is_locked: boolean;
  is_pinned: boolean;
  is_spoiler: boolean;
  thumbnail_url?: string; // optional to incase the user wants pictures
  thumbnail_path?: string;
  episode_number?: number;
  created_at: string;
  last_activity_at: string;
  comment_count: number;
  upvote_count: number;
  season_number?: number;
}

export interface DiscussionResponse {
  discussion: Discussion;
}

export interface DiscussionRequest {
  id?: string;
  anime_id: number;
  title_romaji?: string;
  title_english?: string;
  cover_image_url?: string;
  status?: string;
  season?: string;
  season_year?: number;
  category_id: string;
  created_by?: string; // TODO: NEEDS TO BE CHANGED IN SUPABASE TO AUTH ID
  title: string;
  body: string;
  thumbnail: File | null;
  is_locked: boolean;
  is_spoiler: boolean;
  episode_number?: number;
  season_number?: number;
}

export interface DiscussionsComments {
  id: string;
  discussion_id: string;
  created_by: string;
  parent_comment_id: string;
  body: string;
  is_spoiler: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscussionsCategories {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DiscussionsResponse {
  data: Discussion[];
  total?: number;
}
