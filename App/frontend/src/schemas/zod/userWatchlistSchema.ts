import { z } from "zod";

export const WatchlistStatusSchema = z.enum([
  "plan_to_watch",
  "completed",
  "on_hold",
  "watching",
  "dropped",
]);

export const UserWatchlistRequestSchema = z.object({
  anime_id: z.number().int().positive(),
  title: z.string().min(1),
  genres: z.array(z.string()),
  status: WatchlistStatusSchema,
});

export const UserWatchlistResponseSchema = z.object({
  user_id: z.string(),
  anime_id: z.number().int().positive(),
  title: z.string(),
  genres: z.array(z.string()),
  status: WatchlistStatusSchema,
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export const UserWatchlistListResponseSchema = z.object({
  watchlist: z.array(UserWatchlistResponseSchema),
});

export const UserWatchlistExistsResponseSchema = z.object({
  in_watchlist: z.boolean(),
  item: UserWatchlistResponseSchema.nullable().optional(),
});

export const UserWatchlistSuccessMessageSchema = z.object({
  message: z.string(),
});

export const UserWatchlistStatusUpdateRequestSchema = z.object({
  status: WatchlistStatusSchema,
});

export const UserWatchlistStatusResponseSchema = z.object({
  anime_id: z.number().int().positive(),
  in_watchlist: z.boolean(),
  status: WatchlistStatusSchema.nullable(),
});

export type WatchlistStatus = z.infer<typeof WatchlistStatusSchema>;
export type UserWatchlistRequest = z.infer<typeof UserWatchlistRequestSchema>;
export type UserWatchlistResponse = z.infer<typeof UserWatchlistResponseSchema>;
export type UserWatchlistListResponse = z.infer<
  typeof UserWatchlistListResponseSchema
>;
export type UserWatchlistExistsResponse = z.infer<
  typeof UserWatchlistExistsResponseSchema
>;
export type UserWatchlistSuccessMessage = z.infer<
  typeof UserWatchlistSuccessMessageSchema
>;
export type UserWatchlistStatusUpdateRequest = z.infer<
  typeof UserWatchlistStatusUpdateRequestSchema
>;
export type UserWatchlistStatusResponse = z.infer<
  typeof UserWatchlistStatusResponseSchema
>;
