// this page is for the user to search the for the animes that they are interested in
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDisplayTitle } from "../schemas/animeSchemas";
import type {
  AniListMedia,
  AnimePaginationResponse,
} from "../schemas/animeSchemas";
import {
  getAnimeByCategory,
  getAvailableGenres,
  getSeasons,
} from "../services/api/animeCategoriesService";
import { CategoryFilters } from "../components/CategoryFilters";
import { AnimeCard } from "../components/AnimeCard";
import { AnimeCardSkeleton } from "../components/skeleton/AnimeCardSkeleton";
import { ApiServiceError } from "../components/ApiServiceError";

// default genre for when the user loads into the page
const DEFAULT_GENRE: string[] = ["Action"]; // route in the backend will get the param to pass in
const DEFAULT_SEASON: string = "WINTER";
export const DEFAULT_PAGE: number = 1;
export const DEFAULT_PER_PAGE: number = 30;

export default function AnimeCategoriesPage() {
  // state to update the currentPage for the anime
  const [page, setCurrentPage] = useState<number>(DEFAULT_PAGE);

  // get the params from the search url, and update them
  const [params, setParams] = useSearchParams({
    genres: DEFAULT_GENRE,
    season: DEFAULT_SEASON,
  }); // start the search param as the default param to look for

  // handles getting the search params to send into the query functions
  const selectedGenre = params.get("genres") ?? ""; // get the search param from the param that get passed into the url for the genre
  const selectedSeason = params.get("season") ?? ""; // get the search params that get passed into the url for the season
  const selectedSearch = params.get("search") ?? ""; // get the search term from the url so the filter can react to it

  // displays the genres in the selector
  const {
    data: genres = [],
    error: genresError,
    refetch: refetchGenres,
  } = useQuery<string[], Error>({
    queryKey: ["availableGenres"],
    queryFn: () => getAvailableGenres(),
  });

  // displays the seasons in the selector
  const {
    data: seasons = [],
    error: seasonsError,
    refetch: refetchSeasons,
  } = useQuery<string[], Error>({
    queryKey: ["availableSeasons"],
    queryFn: () => getSeasons(),
  });

  // function to get the specific anime
  const {
    data: animeData,
    isLoading,
    isFetching,
    error: animeError,
    refetch: refetchAnime,
  } = useQuery<AnimePaginationResponse, Error>({
    queryKey: [
      "animeCategory",
      selectedGenre,
      selectedSeason,
      selectedSearch,
      page,
    ],
    queryFn: () =>
      getAnimeByCategory({
        search: selectedSearch || undefined,
        genres: selectedGenre,
        season: selectedSeason,
        page: page,
        perPage: DEFAULT_PER_PAGE,
      }),
  });

  // package media data so that it can be sent used to render the anime card data
  const anime = animeData?.data.Page.media ?? [];
  // package the pageInfo data to use for pagination
  const pageInfo = animeData?.data.Page.pageInfo;

  const handleFilterChange = (type: "genres" | "season", value: string) => {
    // get the current search params from the url
    const next = new URLSearchParams(params);
    if (!value) {
      // if there is no value delete or clear the filter
      next.delete(type);
    } else {
      // otherwise set the type and the value to be passed into the search params
      next.set(type, value);
    }
    // update the search params to pass into the functions
    setParams(next);
    // reset pagination when filters change
    setCurrentPage(DEFAULT_PAGE);
  };

  useEffect(() => {
    setCurrentPage(DEFAULT_PAGE);
  }, [selectedSearch]);

  const canGoPrev = page > 1;
  const canGoNext = pageInfo?.hasNextPage ?? false;

  // only change if the seasons change
  const seasonFilters = useMemo(() => seasons, [seasons]);

  const apiError = animeError || genresError || seasonsError;
  if (apiError) {
    return (
      <ApiServiceError
        title="AniList is temporarily unavailable"
        message={apiError.message}
        onRetry={() => {
          void refetchAnime();
          void refetchGenres();
          void refetchSeasons();
        }}
      />
    );
  }

  return (
    <div className="px-6 py-10 space-y-10">
      {/* NOTE: might align the title and subtitle in the same row */}
      <section className="flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold uppercase text-white">
          {selectedGenre}
        </h1>
        <p className="max-w-3xl text-slate-300">
          {selectedGenre} is anime that you may like to watch. (will change with
          when the genre changes)
        </p>
      </section>

      <section className="flex justify-end items-center gap-2">
        <CategoryFilters
          genres={genres}
          seasons={seasonFilters}
          selectedGenre={selectedGenre}
          selectedSeason={selectedSeason}
          onSelectGenre={(value) => handleFilterChange("genres", value)}
          onSelectSeason={(value) => handleFilterChange("season", value)}
        />
        {/* <div className="bg-black py-2 px-4 uppercase rounded-lg">Other</div> */}
      </section>

      <section className="grid gap-x-15 gap-y-5 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        {isLoading || (isFetching && anime.length === 0)
          ? Array.from({ length: DEFAULT_PER_PAGE }).map((_, index) => (
              <AnimeCardSkeleton key={`anime-card-skeleton-${index}`} />
            ))
          : anime.map((item) => <AnimeCard key={item.id} anime={item} />)}
      </section>

      <section className="flex items-center justify-center gap-4">
        <button
          className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={!canGoPrev}
        >
          Previous
        </button>
        <span className="text-slate-200 text-sm">
          Page {pageInfo?.currentPage ?? page}
        </span>
        <button
          className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!canGoNext}
        >
          Next
        </button>
      </section>
    </div>
  );
}
