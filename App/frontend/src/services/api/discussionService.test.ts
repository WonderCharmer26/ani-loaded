import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAllDiscussions,
  getDiscussionById,
  getDiscussionComments,
  submitDiscussion,
} from "./discussionService";
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
    success: vi.fn(),
  },
}));

describe("discussionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns discussion list from getAllDiscussions", async () => {
    const data = [{ id: "1" }, { id: "2" }];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { data } } as never);

    const result = await getAllDiscussions();

    expect(result).toEqual(data);
    expect(axios.get).toHaveBeenCalledWith("https://api.test/discussions");
  });

  it("returns single discussion from getDiscussionById", async () => {
    const data = { id: "abc" };
    vi.mocked(axios.get).mockResolvedValueOnce({ data } as never);

    const result = await getDiscussionById("abc");

    expect(result).toEqual(data);
    expect(axios.get).toHaveBeenCalledWith("https://api.test/discussions/abc");
  });

  it("returns comment array from getDiscussionComments", async () => {
    const comments = [{ id: "c1" }, { id: "c2" }];
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: comments, total: 2 },
    } as never);

    const result = await getDiscussionComments("123");

    expect(result).toEqual(comments);
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.test/discussions/123/comments",
    );
  });

  it("throws validation error branch first when session retrieval fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: "session failed",
    } as never);

    await expect(
      submitDiscussion({
        anime_id: 1,
        title_romaji: "Romaji",
        title_english: "English",
        cover_image_url: "https://img.test/cover.jpg",
        status: "FINISHED",
        season: "SPRING",
        season_year: 2024,
        category_id: "general",
        title: "Thread title",
        body: "Thread body",
        episode_number: 1,
        season_number: 1,
        thumbnail: null,
        is_locked: false,
        is_spoiler: false,
      }),
    ).rejects.toThrow("There was an error validating your session");

    expect(toast.error).toHaveBeenCalledWith("There was an error: session failed");
    expect(toast.info).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("throws sign-in branch when token is missing", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    await expect(
      submitDiscussion({
        anime_id: 1,
        title_romaji: undefined,
        title_english: undefined,
        cover_image_url: undefined,
        status: undefined,
        season: undefined,
        season_year: undefined,
        category_id: "general",
        title: "Thread title",
        body: "Thread body",
        episode_number: undefined,
        season_number: undefined,
        thumbnail: null,
        is_locked: false,
        is_spoiler: false,
      }),
    ).rejects.toThrow("Make sure you're signed in");

    expect(toast.info).toHaveBeenCalledWith("Please make sign in to make a post");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("posts discussion with auth header and form data", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as never);
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: "discussion-1" },
    } as never);

    const result = await submitDiscussion({
      anime_id: 1,
      title_romaji: "Romaji",
      title_english: "English",
      cover_image_url: "https://img.test/cover.jpg",
      status: "FINISHED",
      season: "SPRING",
      season_year: 2024,
      category_id: "general",
      title: "Thread title",
      body: "Thread body",
      episode_number: 12,
      season_number: 2,
      thumbnail: null,
      is_locked: true,
      is_spoiler: false,
    });

    expect(result).toEqual({ id: "discussion-1" });

    const postCall = vi.mocked(axios.post).mock.calls[0];
    const url = postCall[0];
    const formData = postCall[1] as FormData;
    const config = postCall[2];

    expect(url).toBe("https://api.test/discussion");
    expect(config).toEqual({ headers: { Authorization: "Bearer token-123" } });

    expect(formData.get("anime_id")).toBe("1");
    expect(formData.get("category_id")).toBe("general");
    expect(formData.get("title")).toBe("Thread title");
    expect(formData.get("body")).toBe("Thread body");
    expect(formData.get("is_locked")).toBe("true");
    expect(formData.get("is_spoiler")).toBe("false");
  });
});
