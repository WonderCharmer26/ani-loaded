import { z } from "zod";

export const ChatSessionStatusSchema = z.enum(["active", "expired"]);

export const ChatSessionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  title: z.string().nullable().optional(),
  status: ChatSessionStatusSchema.default("active"),
  message_count: z.number().int().nonnegative().default(0),
  reset_at: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().optional(),
  last_active_at: z.iso.datetime().optional(),
});

export const ChatMessageRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  id: z.uuid(),
  session_id: z.uuid(),
  role: ChatMessageRoleSchema,
  content: z.string().min(1),
  created_at: z.iso.datetime().optional(),
});

export const ChatSessionWithMessagesSchema = ChatSessionSchema.extend({
  messages: z.array(ChatMessageSchema).default([]),
});

// export all the types of the Chat
export type ChatSessionStatus = z.infer<typeof ChatSessionStatusSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSessionWithMessages = z.infer<
  typeof ChatSessionWithMessagesSchema
>;
