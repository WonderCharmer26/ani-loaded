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
  const response = await axios.get(`${backendUrl}/recommendations/conversations`, {
    headers,
  });
  return ChatSessionListSchema.parse(response.data);
}

export async function createRecommendationConversation(): Promise<ChatSession> {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${backendUrl}/recommendations/conversations`,
    {},
    { headers },
  );
  return ChatSessionSchema.parse(response.data);
}

export async function getRecommendationConversation(
  sessionId: string,
): Promise<ChatSessionWithMessages> {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${backendUrl}/recommendations/conversations/${sessionId}`,
    { headers },
  );
  return ChatSessionWithMessagesSchema.parse(response.data);
}

export async function sendRecommendationMessage(
  sessionId: string,
  content: string,
): Promise<ChatSessionWithMessages> {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${backendUrl}/recommendations/conversations/${sessionId}/messages`,
    { content },
    { headers },
  );
  return ChatSessionWithMessagesSchema.parse(response.data);
}
