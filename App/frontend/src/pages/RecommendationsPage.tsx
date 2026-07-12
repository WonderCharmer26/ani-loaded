import { useEffect, useRef, useState } from "react";
import { Plus, MessageSquareText, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";

import RecommendationInput from "../components/RecommendationInput";
import type { RootLayoutOutletContext } from "../layouts/RootLayout";
import type { ChatSession } from "../schemas/zod/chatSchema";
import {
  createRecommendationConversation,
  getRecommendationConversation,
  getRecommendationConversations,
  sendRecommendationMessage,
} from "../services/api/recommendationService";

const UNTITLED_CONVERSATION_LABEL = "New recommendation chat";

function formatConversationTime(timestamp?: string) {
  if (!timestamp) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const { isRecommendationsSidebarOpen, closeRecommendationsSidebar } =
    useOutletContext<RootLayoutOutletContext>();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["recommendationConversations"],
    queryFn: getRecommendationConversations,
  });

  const { data: activeConversation, isLoading: activeConversationLoading } =
    useQuery({
      queryKey: ["recommendationConversation", activeConversationId],
      queryFn: () => getRecommendationConversation(activeConversationId!),
      enabled: Boolean(activeConversationId),
    });

  useEffect(() => {
    if (!conversations.length) {
      setActiveConversationId(null);
      return;
    }

    const activeConversationStillExists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    );

    if (!activeConversationId || !activeConversationStillExists) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const createConversationMutation = useMutation({
    mutationFn: createRecommendationConversation,
    onSuccess: (session) => {
      queryClient.setQueryData<ChatSession[]>(
        ["recommendationConversations"],
        (current = []) => {
          if (!current.length) {
            return [session];
          }
          return [session, ...current.filter((item) => item.id !== session.id)];
        },
      );
      setActiveConversationId(session.id);
      closeRecommendationsSidebar();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      sendRecommendationMessage(sessionId, content),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        ["recommendationConversation", conversation.id],
        conversation,
      );
      queryClient.setQueryData<ChatSession[]>(
        ["recommendationConversations"],
        (current = []) => {
          const updatedSession: ChatSession = {
            id: conversation.id,
            user_id: conversation.user_id,
            title: conversation.title,
            status: conversation.status,
            message_count: conversation.message_count,
            reset_at: conversation.reset_at,
            created_at: conversation.created_at,
            last_active_at: conversation.last_active_at,
          };

          const remainingSessions = current.filter(
            (item) => item.id !== conversation.id,
          );

          return [updatedSession, ...remainingSessions];
        },
      );
      setDraft("");
    },
  });

  const handleCreateConversation = async () => {
    try {
      await createConversationMutation.mutateAsync();
    } catch {
      // errors surface through the service layer toast
    }
  };

  const handleSubmit = async () => {
    const content = draft.trim();

    if (!content || !activeConversationId) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: activeConversationId,
        content,
      });
    } catch {
      // errors surface through the service layer or query error boundaries
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    closeRecommendationsSidebar();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(60,180,255,0.08),transparent_28%),linear-gradient(180deg,#060a11,#0a1019)] px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
          isRecommendationsSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeRecommendationsSidebar}
        aria-hidden="true"
      />

      <aside
        id="recommendations-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(12,19,31,0.98),rgba(8,13,22,0.99))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.42)] transition-transform duration-300 ease-out ${
          isRecommendationsSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isRecommendationsSidebarOpen}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#74cbff]">
              Recommendation chats
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Tune your next watch
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#3CB4FF]/30 bg-[#3CB4FF]/12 text-[#8dd6ff] transition hover:bg-[#3CB4FF]/18 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Create new recommendation chat"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={closeRecommendationsSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/4 text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
              aria-label="Close recommendation chats"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3 overflow-y-auto pr-1">
          {conversationsLoading ? (
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-slate-300">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-[1.7rem] border border-dashed border-white/12 bg-white/3 p-5 text-sm text-slate-300">
              No recommendation chats yet. Start one to keep your anime suggestions organized.
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    isActive
                      ? "border-[#3CB4FF]/35 bg-[#3CB4FF]/10 shadow-[0_10px_28px_rgba(60,180,255,0.12)]"
                      : "border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-medium text-white">
                      {conversation.title || UNTITLED_CONVERSATION_LABEL}
                    </p>
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#7fd4ff]" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{conversation.message_count} messages</span>
                    <span>{formatConversationTime(conversation.last_active_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#09111b]/95 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <section className="flex min-h-[70vh] flex-1 flex-col bg-[linear-gradient(180deg,rgba(9,17,27,0.96),rgba(7,12,20,0.98))]">
          <div className="border-b border-white/8 px-5 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#74cbff]">
              Active thread
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {activeConversation?.title || UNTITLED_CONVERSATION_LABEL}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Ask for follow-ups, refinements, or a completely different vibe in a fresh chat.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            {!activeConversationId && !conversationsLoading ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/3 px-6 text-center">
                <div className="max-w-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#74cbff]">
                    Start a thread
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold text-white">
                    Build a recommendation trail you can revisit
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    Create a recommendation chat, describe the mood you want, then keep refining without losing the earlier suggestions.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateConversation}
                    disabled={createConversationMutation.isPending}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#3CB4FF]/30 bg-[#3CB4FF]/12 px-5 py-3 text-sm font-medium text-[#c5ecff] transition hover:bg-[#3CB4FF]/18 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    New recommendation chat
                  </button>
                </div>
              </div>
            ) : activeConversationLoading ? (
              <div className="rounded-[1.7rem] border border-white/8 bg-white/3 p-5 text-sm text-slate-300">
                Loading conversation...
              </div>
            ) : activeConversation && activeConversation.messages.length > 0 ? (
              <div className="space-y-4">
                {activeConversation.messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-3xl rounded-[1.8rem] px-5 py-4 text-sm leading-7 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${
                          isUser
                            ? "bg-[linear-gradient(135deg,#1b6fa6,#3CB4FF)] text-white"
                            : "border border-white/8 bg-white/5 text-slate-100"
                        }`}
                      >
                        <p className={`mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isUser ? "text-white/70" : "text-slate-400"}`}>
                          {isUser ? "You" : "AniLoaded Agent"}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
                {sendMessageMutation.isPending ? (
                  <div className="flex justify-start">
                    <div className="rounded-[1.8rem] border border-white/8 bg-white/5 px-5 py-4 text-sm text-slate-300">
                      Finding your next watch...
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/3 px-6 text-center text-sm text-slate-300">
                Send the first message in this chat to start building recommendation history.
              </div>
            )}
          </div>

          <div className="border-t border-white/8 px-5 py-5 sm:px-8">
            <RecommendationInput
              value={draft}
              onChange={setDraft}
              onSubmit={handleSubmit}
              isPending={sendMessageMutation.isPending}
              disabled={!activeConversationId || createConversationMutation.isPending}
              placeholder="Describe what you want to watch next"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
