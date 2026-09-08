import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useWatchlistToggle } from "./useWatchlistToggle";

const addToWatchlist = vi.fn();
const removeFromWatchlist = vi.fn();
const getWatchlistStatus = vi.fn();

vi.mock("@/services/api/userWatchlistService", () => ({
  addToWatchlist: (...args: unknown[]) => addToWatchlist(...args),
  removeFromWatchlist: (...args: unknown[]) => removeFromWatchlist(...args),
  getWatchlistStatus: (...args: unknown[]) => getWatchlistStatus(...args),
}));

vi.mock("@/services/supabase/hooks/AuthProvider", () => ({
  useAuthContext: () => ({ user: { id: "user-1" } }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useWatchlistToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("adds anime to watchlist when currently not in watchlist", async () => {
    getWatchlistStatus.mockResolvedValueOnce({
      anime_id: 1,
      in_watchlist: false,
      status: null,
    });
    addToWatchlist.mockResolvedValueOnce({ message: "ok" });

    const anime = {
      id: 1,
      title: { english: "Cowboy Bebop" },
      coverImage: {},
      genres: ["Action"],
    };

    const { result } = renderHook(() => useWatchlistToggle(anime), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInWatchlist).toBe(false);
    });

    act(() => {
      result.current.toggleWatchlist();
    });

    await waitFor(() => {
      expect(addToWatchlist).toHaveBeenCalledWith(1, {
        anime_id: 1,
        title: "Cowboy Bebop",
        genres: ["Action"],
        status: "plan_to_watch",
      });
    });
  });

  it("removes anime from watchlist when currently in watchlist", async () => {
    getWatchlistStatus.mockResolvedValueOnce({
      anime_id: 5,
      in_watchlist: true,
      status: "plan_to_watch",
    });
    removeFromWatchlist.mockResolvedValueOnce({ message: "ok" });

    const anime = {
      id: 5,
      title: { english: "Trigun" },
      coverImage: {},
      genres: [],
    };

    const { result } = renderHook(() => useWatchlistToggle(anime), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInWatchlist).toBe(true);
    });

    act(() => {
      result.current.toggleWatchlist();
    });

    await waitFor(() => {
      expect(removeFromWatchlist).toHaveBeenCalledWith(5);
    });
  });
});
