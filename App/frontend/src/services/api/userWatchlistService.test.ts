import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  addToWatchlist,
  getWatchlistStatus,
  updateWatchlistStatus,
} from "./userWatchlistService";
import { supabase } from "../supabase/supabaseConnection";
import { toast } from "sonner";

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
  },
}));

vi.mock("../supabase/supabaseConnection", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("userWatchlistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws and does not call API when add payload is invalid", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
    } as never);

    await expect(
      addToWatchlist(5, {
        anime_id: 5,
        title: "Anime",
        genres: ["Action"],
        status: "bad_status" as never,
      }),
    ).rejects.toBeInstanceOf(ZodError);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("throws when auth token is missing", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as never);

    await expect(updateWatchlistStatus(1, { status: "watching" })).rejects.toThrow(
      "Missing auth token for watchlist request",
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Please sign in to manage your watchlist",
    );
    expect(axios.patch).not.toHaveBeenCalled();
  });

  it("throws zod error when status response shape is invalid", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: "token-123" } },
    } as never);
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { anime_id: 1, in_watchlist: true, status: "invalid" },
    } as never);

    await expect(getWatchlistStatus(1)).rejects.toBeInstanceOf(ZodError);
  });
});
