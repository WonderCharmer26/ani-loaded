// TODO: Ensure that real data is later fetched from the backend
import axios from "axios";
import { backendUrl } from "./fetchAnimes";
import { toast } from "sonner";
import type {
  UserListRequest,
  UserListResponse,
} from "@/schemas/zod/listFormSchema";

// NOTE: Get Functions

// function to get all users lists that are public
export const getAllLists = async (): Promise<UserListResponse[]> => {
  // get the data from the backend
  const response = await axios.get<UserListResponse[]>(`${backendUrl}/lists`);

  if (!response.data) {
    toast.error("There was an error getting all the anime lists");
    throw new Error("There was an error getting all the anime lists");
  }

  return response.data;
};

// function to get the users current lists
export const getUsersTopLists = async (
  userToken: string | null,
): Promise<UserListResponse[]> => {
  // check if user is logged in
  if (!userToken) {
    toast.error("Please make sure your logged in order to view your lists");
  }

  const response = await axios.get<UserListResponse[]>(
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
export const getPopularLists = async (): Promise<UserListResponse[]> => {
  const response = await axios.get<UserListResponse[]>(
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
  const response = await axios.post(`${backendUrl}/create-list`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data) {
    toast.error("There was an error getting popular lists");
    throw new Error("There was an error getting popular lists");
  }

  return response.data;
};
