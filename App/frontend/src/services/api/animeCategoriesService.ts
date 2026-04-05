// TODO: make functions get real data from the database later on
import type { AnimePaginationResponse } from "../../schemas/animeSchemas";
import axios from "axios";
import { backendUrl } from "./fetchAnimes";
import { GenreI } from "../../schemas/genres";
import { SeasonsI } from "../../schemas/seasons";
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from "../../pages/AnimeCategoriesPage";

function buildApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const detailText =
      typeof detail === "string" ? detail : error.message || fallback;

    if (status) {
      return new Error(`${fallback} (status ${status}): ${detailText}`);
    }

    return new Error(`${fallback}: ${detailText}`);
  }

  if (error instanceof Error) {
    return new Error(`${fallback}: ${error.message}`);
  }

  return new Error(fallback);
}

// interface for the filters (same as the backend)
interface CategoryFilters {
  // might make also null as well
  search?: string; // optional search parameter
  genres?: string; // takes in an array of genres to send off
  season?: string;
  page?: number;
  perPage?: number;
}

// function to get the anime by category
export async function getAnimeByCategory(
  filters: CategoryFilters,
): Promise<AnimePaginationResponse> {
  try {
    const res = await axios.get<AnimePaginationResponse>(
      `${backendUrl}/anime/categories`,
      {
        // search param affects the type of filtering on the backend route
        params: {
          ...filters,
          page: filters.page ?? DEFAULT_PAGE,
          perPage: filters.perPage ?? DEFAULT_PER_PAGE,
        },
      },
    );

    // handle edge case to check if page data is sent back from the backend
    const page = res.data?.data?.Page;

    if (!page) {
      throw new Error("No page data found in the category fetch response");
    }

    return res.data;
  } catch (error) {
    throw buildApiError(error, "Failed to fetch category data");
  }
}

export async function getAvailableGenres(): Promise<string[]> {
  try {
    const res = await axios.get<GenreI>(`${backendUrl}/anime/genres`);
    return res.data.genres;
  } catch (error) {
    throw buildApiError(error, "Failed to fetch available genres");
  }
}

export async function getSeasons(): Promise<string[]> {
  try {
    const res = await axios.get<SeasonsI>(`${backendUrl}/anime/seasons`);
    return res.data?.seasons;
  } catch (error) {
    throw buildApiError(error, "Failed to fetch available seasons");
  }
}
