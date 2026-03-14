import "axios";
import axios from "axios";
import {
  Discussion,
  DiscussionsResponse,
  DiscussionsComments,
  DiscussionRequest,
  DiscussionResponse,
} from "../../schemas/discussion";
import { backendUrl } from "./fetchAnimes";
import { useAuthContext } from "../supabase/hooks/AuthProvider";
import { supabase } from "../supabase/supabaseConnection";
import { toast } from "sonner";

// funtion gets all discussions
export async function getAllDiscussions(): Promise<Discussion[]> {
  const res = await axios.get<DiscussionsResponse>(`${backendUrl}/discussions`);
  return res.data.data;
}

// function to get the specific discussions
export async function getDiscussionById(id: string): Promise<Discussion> {
  const res = await axios.get<Discussion>(`${backendUrl}/discussions/${id}`);
  return res.data;
}

// function to get discussion comments
export async function getDiscussionComments(
  discussionId: string,
): Promise<DiscussionsComments[]> {
  const res = await axios.get<{ data: DiscussionsComments[]; total: number }>(
    `${backendUrl}/discussions/${discussionId}/comments`,
  );
  return res.data.data;
}

// function to submit the discussions
export async function submitDiscussion({
  anime_id,
  title_romaji,
  title_english,
  cover_image_url,
  status,
  season,
  season_year,
  category_id,
  title,
  body,
  episode_number,
  season_number,
  thumbnail,
  is_locked,
  is_spoiler,
}: DiscussionRequest): Promise<DiscussionResponse> {
  // create form obj to send off
  const formData = new FormData();

  // add inputs to form
  formData.append("anime_id", String(anime_id));
  if (title_romaji) formData.append("title_romaji", title_romaji);
  if (title_english) formData.append("title_english", title_english);
  if (cover_image_url) formData.append("cover_image_url", cover_image_url);
  if (status) formData.append("status", status);
  if (season) formData.append("season", season);

  // add if there is a year inputed
  if (season_year !== undefined) {
    formData.append("season_year", String(season_year));
  }
  formData.append("category_id", category_id);
  formData.append("title", title);
  formData.append("body", body);

  // add if there is an episode_number
  if (episode_number !== undefined) {
    formData.append("episode_number", String(episode_number));
  }

  // add if there is a season_number
  if (season_number !== undefined) {
    formData.append("season_number", String(season_number));
  }

  formData.append("is_locked", String(is_locked)); // make bool on the backend (form doesn't take bools)
  formData.append("is_spoiler", String(is_spoiler)); // make bool on the backend (form doesn't take bools)

  // add the thumbnail file if user uploads one
  if (thumbnail) formData.append("thumbnail", thumbnail);

  // get users current session to send to the backend
  const { data: sessionData, error } = await supabase.auth.getSession();

  // store the token
  const token = sessionData.session?.access_token;

  if (!token) {
    toast.info("Please make sign in to make a post");
    throw new Error("Make sure you're signed in");
  }

  if (error) {
    toast.error(`There was an error: ${error}`);
    throw new Error("There was an error validating your session");
  }

  // send to the form to the backend for backend to handle validating
  const res = await axios.post(`${backendUrl}/discussion`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // handle if we don't get back the data
  if (!res.data) {
    throw new Error("Error posting discussion");
  }
  // return the data
  return res.data;
}
