import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createRecommendationConversation,
  getRecommendationConversation,
  getRecommendationConversations,
  sendRecommendationMessage,
} from "./recommendationService";
import { supabase } from "../supabase/supabaseConnection";
import { toast } from "sonner";

vi.mock("./fetchAnimes", () => ({
  backendUrl: "https://api.test",
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../supabase/supabaseConnection", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const sessionRow = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: "22222222-2222-4222-8222-222222222222",
  title: "Dark fantasy recs",
  status: "active",
  message_count: 2,
  reset_at: null,
  created_at: "2024-01-01T00:00:00Z",
  last_active_at: "2024-01-01T00:00:00Z",
};

describe("recommendationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recommendation conversations", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as never);
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [sessionRow] } as never);

    const result = await getRecommendationConversations();

    expect(result).toEqual([sessionRow]);
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.test/recommendations/conversations",
      { headers: { Authorization: "Bearer token-123" } },
    );
  });

  it("creates a recommendation conversation", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as never);
    vi.mocked(axios.post).mockResolvedValueOnce({ data: sessionRow } as never);

    const result = await createRecommendationConversation();

    expect(result).toEqual(sessionRow);
    expect(axios.post).toHaveBeenCalledWith(
      "https://api.test/recommendations/conversations",
      {},
      { headers: { Authorization: "Bearer token-123" } },
    );
  });

  it("returns one recommendation conversation", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as never);
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { ...sessionRow, messages: [] },
    } as never);

    const result = await getRecommendationConversation(sessionRow.id);

    expect(result).toEqual({ ...sessionRow, messages: [] });
    expect(axios.get).toHaveBeenCalledWith(
      `https://api.test/recommendations/conversations/${sessionRow.id}`,
      { headers: { Authorization: "Bearer token-123" } },
    );
  });

  it("sends a recommendation message", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as never);
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        ...sessionRow,
        messages: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            session_id: sessionRow.id,
            role: "user",
            content: "Need dark fantasy",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      },
    } as never);

    const result = await sendRecommendationMessage(
      sessionRow.id,
      "Need dark fantasy",
    );

    expect(result.messages[0].content).toBe("Need dark fantasy");
    expect(axios.post).toHaveBeenCalledWith(
      `https://api.test/recommendations/conversations/${sessionRow.id}/messages`,
      { content: "Need dark fantasy" },
      { headers: { Authorization: "Bearer token-123" } },
    );
  });

  it("throws when auth validation fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: "session failed",
    } as never);

    await expect(getRecommendationConversations()).rejects.toThrow(
      "There was an error validating your session",
    );

    expect(toast.error).toHaveBeenCalledWith("Unable to validate your session.");
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("throws when token is missing", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    await expect(createRecommendationConversation()).rejects.toThrow(
      "Missing auth token for recommendation request",
    );

    expect(toast.info).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
