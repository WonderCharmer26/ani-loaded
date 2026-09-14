import axios from "axios";
import { z } from "zod";
import { toast } from "sonner";

import {
  ChatSessionSchema,
  ChatSessionWithMessagesSchema,
  type ChatSession,
  type ChatSessionWithMessages,
} from "@/schemas/zod/chatSchema";
import { backendUrl } from "./fetchAnimes";
import { supabase } from "../supabase/supabaseConnection";

const ChatSessionListSchema = z.array(ChatSessionSchema);

function buildApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const detailText =
      typeof detail === "string" ? detail : error.message || fallback;

    if (status) {
      return new Error(`${fallback} (status ${status}): ${detailText}`);
    }

    return new Error(`${fallback}: ${detailText}`);
  }

  if (error instanceof Error) {
    return new Error(`${fallback}: ${error.message}`);
  }

  return new Error(fallback);
}

const getAuthHeader = async (): Promise<{ Authorization: string }> => {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error) {
    toast.error("Unable to validate your session.");
    throw new Error("There was an error validating your session");
  }

  if (!token) {
    throw new Error("Missing auth token for recommendation request");
  }

  return { Authorization: `Bearer ${token}` };
};

export async function getRecommendationConversations(): Promise<ChatSession[]> {
  const headers = await getAuthHeader();

  try {
    const response = await axios.get(
      `${backendUrl}/recommendations/conversations`,
      {
        headers,
      },
    );
    return ChatSessionListSchema.parse(response.data);
  } catch (error) {
    throw buildApiError(error, "Failed to load recommendation chats");
  }
}

export async function createRecommendationConversation(): Promise<ChatSession> {
  const headers = await getAuthHeader();

  try {
    const response = await axios.post(
      `${backendUrl}/recommendations/conversations`,
      {},
      { headers },
    );
    return ChatSessionSchema.parse(response.data);
  } catch (error) {
    throw buildApiError(error, "Failed to create recommendation chat");
  }
}

export async function getRecommendationConversation(
  sessionId: string,
): Promise<ChatSessionWithMessages> {
  const headers = await getAuthHeader();

  try {
    const response = await axios.get(
      `${backendUrl}/recommendations/conversations/${sessionId}`,
      { headers },
    );
    return ChatSessionWithMessagesSchema.parse(response.data);
  } catch (error) {
    throw buildApiError(error, "Failed to load recommendation chat");
  }
}

export async function sendRecommendationMessage(
  sessionId: string,
  content: string,
): Promise<ChatSessionWithMessages> {
  const headers = await getAuthHeader();

  try {
    const response = await axios.post(
      `${backendUrl}/recommendations/conversations/${sessionId}/messages`,
      { content },
      { headers },
    );
    return ChatSessionWithMessagesSchema.parse(response.data);
  } catch (error) {
    throw buildApiError(error, "Failed to send recommendation message");
  }
}
