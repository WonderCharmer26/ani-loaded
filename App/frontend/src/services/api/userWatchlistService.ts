import axios from "axios";
import { toast } from "sonner";

import { backendUrl } from "./fetchAnimes";
import { supabase } from "../supabase/supabaseConnection";
import {
  UserWatchlistExistsResponseSchema,
  UserWatchlistListResponseSchema,
  UserWatchlistRequestSchema,
  UserWatchlistStatusResponseSchema,
  UserWatchlistStatusUpdateRequestSchema,
  UserWatchlistSuccessMessageSchema,
  type UserWatchlistExistsResponse,
  type UserWatchlistListResponse,
  type UserWatchlistRequest,
  type UserWatchlistStatusResponse,
  type UserWatchlistStatusUpdateRequest,
  type UserWatchlistSuccessMessage,
} from "@/schemas/zod/userWatchlistSchema";

// NOTE: make into a helper function that would would be able to be used in other functions that need the access_token passed in
const getAuthHeader = async (): Promise<{ Authorization: string }> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    toast.error("Please sign in to manage your watchlist");
    throw new Error("Missing auth token for watchlist request");
  }

  return { Authorization: `Bearer ${token}` };
};

export const getUserWatchlist =
  async (): Promise<UserWatchlistListResponse> => {
    const headers = await getAuthHeader();
    const response = await axios.get(`${backendUrl}/watchlist`, { headers });
    return UserWatchlistListResponseSchema.parse(response.data);
  };

export const checkIfAnimeInWatchlist = async (
  animeId: number,
): Promise<UserWatchlistExistsResponse> => {
  const headers = await getAuthHeader();
  const response = await axios.get(`${backendUrl}/watchlist/${animeId}`, {
    headers,
  });
  return UserWatchlistExistsResponseSchema.parse(response.data);
};

export const addToWatchlist = async (
  animeId: number,
  payload: UserWatchlistRequest,
): Promise<UserWatchlistSuccessMessage> => {
  const headers = await getAuthHeader();
  const validatedPayload = UserWatchlistRequestSchema.parse(payload);
  const response = await axios.post(
    `${backendUrl}/watchlist/${animeId}`,
    validatedPayload,
    { headers },
  );
  return UserWatchlistSuccessMessageSchema.parse(response.data);
};

export const updateWatchlistStatus = async (
  animeId: number,
  payload: UserWatchlistStatusUpdateRequest,
): Promise<UserWatchlistSuccessMessage> => {
  const headers = await getAuthHeader();
  const validatedPayload =
    UserWatchlistStatusUpdateRequestSchema.parse(payload);
  const response = await axios.patch(
    `${backendUrl}/watchlist/${animeId}`,
    validatedPayload,
    { headers },
  );
  return UserWatchlistSuccessMessageSchema.parse(response.data);
};

export const removeFromWatchlist = async (
  animeId: number,
): Promise<UserWatchlistSuccessMessage> => {
  const headers = await getAuthHeader();
  const response = await axios.delete(`${backendUrl}/watchlist/${animeId}`, {
    headers,
  });
  return UserWatchlistSuccessMessageSchema.parse(response.data);
};

export const getWatchlistStatus = async (
  animeId: number,
): Promise<UserWatchlistStatusResponse> => {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${backendUrl}/watchlist/status/${animeId}`,
    {
      headers,
    },
  );
  return UserWatchlistStatusResponseSchema.parse(response.data);
};

export const getUserWatchlistByUserId = async (
  userId: string,
): Promise<UserWatchlistListResponse> => {
  const response = await axios.get(`${backendUrl}/users/${userId}/watchlist`);
  return UserWatchlistListResponseSchema.parse(response.data);
};
