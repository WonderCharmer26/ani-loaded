import z, { array, number, string, uuid } from "zod";
import { AniListMedia } from "../animeSchemas";

//NOTE: im going to move to seperate file to be reused
// NOTE: edit schema on here & supabase gonna add feild for the amount for the request
// NOTE: I made validatation only for form on the request not on the validatation from the response (might restruct later)
export const VisibilitySchema = z.enum(["public", "private"]); // for validatation

// type to use for private or public setting
export type Visibility = z.infer<typeof VisibilitySchema>;

// validatation for anime chosen
export const UserListEntrySchema = z.object({
  // id if not needed, supabase handles that for us
  // list_id: uuid().optional(),
  anime_id: number().int().positive(),
  rank: number().int().positive(),
  genre: string().nullable().optional(), // might add in later on
  created_at: string().optional(), // might add in later on and send to the database
});

// type for user's each individual list entry
export type UserListEntry = z.infer<typeof UserListEntrySchema>;

// validatation for the users list (structure for the request)
export const UserListFormSchema = z.object({
  // id if not needed, supabase handles that for us
  title: string(),
  genre: string().nullable(), // optional user can make a genaric list
  description: string().nullable(), // optional if the user just wants to put a title
  visibility: VisibilitySchema,
  owner_id: string().optional(),
  created_at: string().optional(),
  updated_at: string().optional(),
});

// type for list form
export type UserListForm = z.infer<typeof UserListFormSchema>;

// FOR REQUEST
export const UserListRequestSchema = UserListFormSchema.extend({
  amount: number().int().positive(), // amount of entries
  entries: array(UserListEntrySchema),
});

// type we can use for type saftey
export type UserListRequest = z.infer<typeof UserListRequestSchema>;

// FOR RESPONSE
export interface UserListEntryResponse extends UserListEntry {
  // anime data we get back
  id: string; // might not be needed
  anime: AniListMedia | null;
}

export interface UserListResponse extends UserListForm {
  id: string; // might not be needed
  is_owner: boolean;
  owner_username: string;
  user_list_entry: UserListEntryResponse[];
}

// wrapper for the backend payload
export interface UserListResponseWrapper {
  list: UserListResponse;
}
