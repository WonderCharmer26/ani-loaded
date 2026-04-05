import { beforeEach, describe, expect, it, vi } from "vitest";

import { animeInfoPrefetcher } from "./animeInfoPrefetcher";
import { getAnimeInfo, getTrending } from "../api/fetchAnimes";

vi.mock("../api/fetchAnimes", () => ({
  getAnimeInfo: vi.fn(),
  getTrending: vi.fn(),
}));

describe("animeInfoPrefetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws a 400 Response for invalid anime id", async () => {
    const queryClient = {
      ensureQueryData: vi.fn(),
      prefetchQuery: vi.fn(),
    };

    const loader = animeInfoPrefetcher(queryClient as never);

    try {
      await loader({ params: { id: "abc" } } as never);
      throw new Error("Expected loader to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(400);
      expect(queryClient.ensureQueryData).not.toHaveBeenCalled();
      expect(queryClient.prefetchQuery).not.toHaveBeenCalled();
    }
  });

  it("prefetches anime info and trending data for a valid id", async () => {
    vi.mocked(getAnimeInfo).mockResolvedValue({ id: 123 } as never);
    vi.mocked(getTrending).mockResolvedValue([]);

    const queryClient = {
      ensureQueryData: vi.fn(({ queryFn }: { queryFn: () => Promise<unknown> }) =>
        queryFn(),
      ),
      prefetchQuery: vi.fn(({ queryFn }: { queryFn: () => Promise<unknown> }) =>
        queryFn(),
      ),
    };

    const loader = animeInfoPrefetcher(queryClient as never);
    const result = await loader({ params: { id: "123" } } as never);

    expect(result).toBeNull();
    expect(queryClient.ensureQueryData).toHaveBeenCalledWith({
      queryKey: ["animeInfo", 123],
      queryFn: expect.any(Function),
    });
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
      queryKey: ["trendingAnime"],
      queryFn: expect.any(Function),
    });
    expect(getAnimeInfo).toHaveBeenCalledWith(123);
    expect(getTrending).toHaveBeenCalledTimes(1);
  });
});
