import type { AniListMedia } from "./animeSchemas";

// indidual users list
export interface UserList {
  id: string;
  title: string;
  description: string | null;
  visibility: "public" | "private";
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// entry that the user makes for the list
export interface UserListEntry {
  id: string;
  list_id: string;
  anime_id: number;
  rank: number | null;
  genre: string | null;
  created_at: string;
}

// request to send to the backend
export interface UserListRequest extends UserList {
  entries: UserListEntry[];
}

// each individual user list ranking w/ anime from the backend to display on the frontend (individual cards to be displayed)
export interface UserListEntryResponse extends UserListEntry {
  anime: AniListMedia;
}

// response get the users list and the anime back from the backend
export interface UserListResponse extends UserList {
  entries: UserListEntryResponse[];
}
