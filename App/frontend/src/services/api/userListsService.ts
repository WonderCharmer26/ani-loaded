// TODO: Ensure that real data is later fetched from the backend
import axios from "axios";
import type { AniListMedia } from "../../schemas/animeSchemas";
import type { UserAnimeList } from "../../schemas/userLists";
import { backendUrl } from "./fetchAnimes";
import { toast } from "sonner";
import { supabase } from "../supabase/supabaseConnection";

// function to get all users lists that are public
const getAllLists = async (): Promise<any> => {
  // get the data from the backend
  const response = await axios.get<any>(`${backendUrl}/lists`);

  if (!response.data) {
    toast.error("There was an error getting all the anime lists");
    throw new Error("There was an error getting all the anime lists");
  }

  return response.data;
};

// function to get the users current lists
const getUserLists = async (): Promise<any> => {
  // check if the user is logged in
  const token = supabase.auth.getSession();

  if (!token) {
    toast.error("Please make sure your logged in order to view your lists");
  }

  const response = await axios.get<any>(`${backendUrl}/users-list`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.data) {
    toast.error("There was an error getting your lists");
    throw new Error("There was an error getting your lists");
  }

  return response.data;
};

// function to get all the popular lists
const getPopularLists = async (): Promise<any> => {
  const response = await axios.get(`${backendUrl}/popular-lists`);
};
