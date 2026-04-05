import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

async function loadModule() {
  vi.resetModules();
  vi.stubEnv("VITE_BACKEND_URL", "https://api.test");
  return import("./fetchAnimes");
}

describe("fetchAnimes service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns media list for getTrending", async () => {
    const media = [{ id: 1 }, { id: 2 }];
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: { Page: { media } } },
    } as never);

    const { getTrending } = await loadModule();
    const result = await getTrending();

    expect(result).toEqual(media);
    expect(axios.get).toHaveBeenCalledWith("https://api.test/anime/trending");
  });

  it("returns an empty array for missing popular media payload", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: {} } } as never);

    const { getPopular } = await loadModule();
    const result = await getPopular();

    expect(result).toEqual([]);
  });

  it("throws for invalid anime id input", async () => {
    const { getAnimeInfo } = await loadModule();

    await expect(getAnimeInfo(0)).rejects.toThrow(
      "Invalid anime id. The id must be a positive integer.",
    );
  });

  it("returns anime info for a valid id", async () => {
    const media = { id: 101, title: { english: "Test" }, coverImage: {} };
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: { Media: media } },
    } as never);

    const { getAnimeInfo } = await loadModule();
    const result = await getAnimeInfo(101);

    expect(result).toEqual(media);
    expect(axios.get).toHaveBeenCalledWith("https://api.test/anime/101");
  });

  it("formats axios errors with status and detail", async () => {
    const axiosError = {
      response: { status: 500, data: { detail: "Backend failure" } },
      message: "Request failed",
    };

    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.get).mockRejectedValueOnce(axiosError);

    const { getTrending } = await loadModule();

    await expect(getTrending()).rejects.toThrow(
      "Failed to fetch trending anime (status 500): Backend failure",
    );
  });

  it("formats non-axios errors with fallback message", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Network down"));

    const { getTopAnime } = await loadModule();

    await expect(getTopAnime()).rejects.toThrow(
      "Failed to fetch top anime: Network down",
    );
  });
});
