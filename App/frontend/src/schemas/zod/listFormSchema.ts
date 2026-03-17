import z, { array, number, string } from "zod";
import { AniListMedia } from "../animeSchemas";

//NOTE: im going to move to seperate file to be reused
export const VisibilitySchema = z.enum(["public", "private"]); // for validatation

export type Visibility = z.infer<typeof VisibilitySchema>;

// validatation for anime chosen
export const UserListEntrySchema = z.object({
  // id if not needed, supabase handles that for us
  list_id: string(),
  anime_id: number().int().positive(),
  rank: number().int().positive().nullable(),
  genre: string().nullable(),
  created_at: string(),
});

// type for user's each individual list entry
export type UserListEntry = z.infer<typeof UserListEntrySchema>;

// validatation for the users list (structure for the request)
export const UserListFormSchema = z.object({
  // id if not needed, supabase handles that for us
  title: string(),
  description: string().nullable(), // optional if the user just wants to put a title
  visibility: VisibilitySchema,
  owner_id: string(),
  created_at: string(),
  updated_at: string(),
});

// type for list form
export type UserList = z.infer<typeof UserListFormSchema>;

// FOR REQUEST
export const UserListRequestSchema = UserListFormSchema.extend({
  entries: array(UserListEntrySchema),
});

// type we can use for type saftey
export type UserListRequest = z.infer<typeof UserListRequestSchema>;

// FOR RESPONSE
export interface UserListEntryResponse extends UserListEntry {
  // anime data we get back
  id: string; // might not be needed
  anime: AniListMedia;
}

export interface UserListResponse extends UserList {
  id: string; // might not be needed
  entries: UserListEntryResponse[];
}
