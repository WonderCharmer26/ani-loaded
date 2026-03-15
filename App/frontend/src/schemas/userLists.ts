import { AniListMedia } from "./animeSchemas";

// TODO: WORK ON THE SCHEMAS
export interface UserListEntry {
  id: string;
  rank: number;
  category: string;
  anime: AniListMedia;
}

export interface UserAnimeList {
  id: string;
  category: string; // NOTE: might make title instead so that there can be custom lists instead
  description?: string; // optional if the user wants to put description
  visibility: "public" | "private"; // choice if the user wants to make private
  updatedAt?: string;
  createdAt?: string;
  ownerId: string; // seperate function to get username
  entries: UserListEntry[];
}
