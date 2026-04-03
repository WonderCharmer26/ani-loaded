// TODO: Ensure that real data is later fetched from the backend
import axios from "axios";
import { backendUrl } from "./fetchAnimes";
import { toast } from "sonner";
import type {
  UserListRequest,
  UserListResponse,
  UserListResponseWrapper,
  UserListUpdateRequest,
} from "@/schemas/zod/listFormSchema";
import { UserListUpdateSchema } from "@/schemas/zod/listFormSchema";
import { supabase } from "../supabase/supabaseConnection";

// NOTE: Get Functions

// function to get all users lists that are public
export const getAllLists = async (): Promise<UserListResponse[]> => {
  // get the data from the backend
  const response = await axios.get<UserListResponse[]>(`${backendUrl}/lists`);

  if (!response.data) {
    toast.error("There was an error getting all the anime lists");
    throw new Error("There was an error getting all the anime lists");
  }

  // let the page map out the data
  return response.data;
};

// function to get specific list
export const getSpecificList = async (
  list_id: string,
): Promise<UserListResponse> => {
  // get the session id
  const { data } = await supabase.auth.getSession();

  const userToken = data.session?.access_token;

  const headers = userToken
    ? { Authorization: `Bearer ${userToken}` }
    : undefined;

  const response = await axios.get<UserListResponse>(
    `${backendUrl}/list/${list_id}`,
    { headers },
  );

  // handle error
  if (!response.data) {
    toast.error("There was an error getting this specific list");
    throw new Error("There was an error getting this list data");
  }

  return response.data;
};

// function to get the users current lists
export const getUsersTopLists = async (
  userToken: string | null,
): Promise<UserListResponseWrapper[]> => {
  // check if user is logged in
  if (!userToken) {
    toast.error("Please make sure your logged in order to view your lists");
  }

  const response = await axios.get<UserListResponseWrapper[]>(
    `${backendUrl}/user-list`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    },
  );

  if (!response.data) {
    toast.error("There was an error getting your lists");
    throw new Error("There was an error getting your lists");
  }

  return response.data;
};

// function to get all the popular lists
export const getPopularLists = async (): Promise<UserListResponseWrapper[]> => {
  const response = await axios.get<UserListResponseWrapper[]>(
    `${backendUrl}/popular-lists`,
  );

  if (!response.data) {
    toast.error("There was an error getting popular lists");
    throw new Error("There was an error getting popular lists");
  }

  return response.data;
};

//NOTE: POST FUNCTIONS
export const postUserList = async (
  formData: UserListRequest, // packaged on the ListSubmitPage
  token: string,
): Promise<UserListResponse> => {
  // validate the form before senfing to the backend (lists page handles this as well)
  // might add a response type
  const response = await axios.post<UserListResponseWrapper>(
    `${backendUrl}/create-list`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.data) {
    toast.error("There was an error getting popular lists");
    throw new Error("There was an error getting popular lists");
  }

  return response.data.list;
};

// NOTE: PATCH FUNCTIONS
export const updateList = async (
  list_id: string | undefined,
  formChanges: UserListUpdateRequest,
): Promise<{ message: string }> => {
  const validatedFormChanges = UserListUpdateSchema.parse(formChanges);

  // for auth check
  const { data } = await supabase.auth.getSession();
  const userToken = data.session?.access_token;

  if (!userToken) {
    toast.error("Please log in to update your list");
    throw new Error("Missing auth token for list update");
  }

  const response = await axios.patch(
    `${backendUrl}/list/${list_id}`,
    validatedFormChanges,
    { headers: { Authorization: `Bearer ${userToken}` } },
  );

  if (!response.data) {
    toast.error("There was an error changing your list");
    throw new Error("There was an error changing your list");
  }

  return response.data;
};
