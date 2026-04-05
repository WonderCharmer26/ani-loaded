import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  deleteList,
  getSpecificList,
  getUsersTopLists,
  postUserList,
  updateList,
} from "./userListsService";
import { toast } from "sonner";
import { supabase } from "../supabase/supabaseConnection";

vi.mock("./fetchAnimes", () => ({
  backendUrl: "https://api.test",
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../supabase/supabaseConnection", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("userListsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds auth header in getSpecificList when session token exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
    } as never);
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { id: "list-1" } } as never);

    const result = await getSpecificList("list-1");

    expect(result).toEqual({ id: "list-1" });
    expect(axios.get).toHaveBeenCalledWith("https://api.test/list/list-1", {
      headers: { Authorization: "Bearer token-123" },
    });
  });

  it("toasts when getUsersTopLists has no token and still requests data", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] } as never);

    const result = await getUsersTopLists(null);

    expect(toast.error).toHaveBeenCalledWith(
      "Please make sure your logged in order to view your lists",
    );
    expect(axios.get).toHaveBeenCalledWith("https://api.test/user-list", {
      headers: { Authorization: "Bearer null" },
    });
    expect(result).toEqual([]);
  });

  it("throws and toasts in deleteList when auth token is missing", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as never);

    await expect(deleteList("list-1")).rejects.toThrow(
      "Missing auth token for list deletion",
    );
    expect(toast.error).toHaveBeenCalledWith("Please log in to delete your list");
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("validates updateList input with zod before any auth request", async () => {
    const invalidPayload = {
      list_data: { title: "New title" },
      entries: [{ anime_id: 12, rank: -1 }],
    };

    await expect(updateList("list-1", invalidPayload)).rejects.toBeInstanceOf(
      ZodError,
    );
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
    expect(axios.patch).not.toHaveBeenCalled();
  });

  it("patches list data when updateList payload and auth are valid", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
    } as never);
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { message: "updated" },
    } as never);

    const payload = {
      list_data: { title: "Updated title", description: "Updated description" },
      entries: [{ anime_id: 10, rank: 1 }],
    };

    const result = await updateList("list-1", payload);

    expect(result).toEqual({ message: "updated" });
    expect(axios.patch).toHaveBeenCalledWith(
      "https://api.test/list/list-1",
      payload,
      { headers: { Authorization: "Bearer token-123" } },
    );
  });

  it("throws and toasts when postUserList response has no data", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: null } as never);

    await expect(
      postUserList(
        {
          title: "Top 5",
          genre: "Action",
          description: "desc",
          visibility: "public",
          amount: 1,
          entries: [{ anime_id: 101, rank: 1 }],
        },
        "token-123",
      ),
    ).rejects.toThrow("There was an error getting popular lists");

    expect(toast.error).toHaveBeenCalledWith(
      "There was an error getting popular lists",
    );
  });
});
