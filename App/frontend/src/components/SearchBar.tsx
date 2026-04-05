import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { AnimePaginationResponse } from "../schemas/animeSchemas";
import { getAnimeByCategory } from "../services/api/animeCategoriesService";

const PAGE: number = 1;
const PER_PAGE: number = 5; // amount of suggestions to show under the input
const DEBOUNCE_DELAY = 400;

export const SearchBar = () => {
  const [search, setSearch] = useState(""); // updates the search after every input
  const [debouncedSearch, setDebouncedSearch] = useState(""); // updated search that saves after a few seconds, takes val from search
  const location = useLocation(); // use to determine the location for the  function
  const [, setSearchParams] = useSearchParams(); // stores the data from the search param

  // function to query the data from the backend
  const { data, isFetching } = useQuery<AnimePaginationResponse>({
    queryKey: ["animeSearchSuggestions", debouncedSearch], // runs everytime the debouncedSearch changes
    queryFn: () =>
      getAnimeByCategory({
        search: debouncedSearch, // search that helps avoid rate limiting
        page: PAGE,
        perPage: PER_PAGE,
      }),
    // only launch the query wnen the length of the debouncedSearch is longer than 0
    enabled: debouncedSearch.length > 0,
  });

  // structure the suggestions that will be shown bellow the search bar
  const suggestions = data?.data.Page.media ?? [];

  // runs whenever the search param changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim()); // takes in the search word, only updates again after a little while
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [search]);

  // runs when the debouncedSearch, location pathname, or URLSearchParams changes
  // NOTE: if on the anime page
  useEffect(() => {
    // cancel if not on the anime page
    if (location.pathname !== "/anime") {
      return;
    }

    // get the value of the search param from the url
    const params = new URLSearchParams(location.search);
    // get the currentSearch from the url and check if the value matches
    const currentSearch = params.get("search") ?? ""; // make search empty if nothing in the search url

    // leave out if the current search and the debouncedSearch match to avoid needless work
    if (currentSearch === debouncedSearch) {
      return; // return skip the extra work, query function should run
    }

    // if there is a debouncedSearch
    if (debouncedSearch) {
      // update the search value to the debouncedSearch
      params.set("search", debouncedSearch);
    } else {
      // delete the search value and reset it for the next value
      params.delete("search");
    }

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, location.pathname, location.search, setSearchParams]);

  // reruns if the pathname changes, or the search params for the search changes
  // only runs on the anime page
  useEffect(() => {
    // cancels if not on the anime page
    if (location.pathname !== "/anime") {
      return;
    }

    // update the search params in the url so when navigating back, the last search stays the same
    const paramSearch =
      new URLSearchParams(location.search).get("search") ?? "";
    // updates the search input to match the url search param
    setSearch(paramSearch);
    setDebouncedSearch(paramSearch);
  }, [location.pathname, location.search]);

  // update the search string in the input and the debouncedSearch
  const handleSuggestionClick = () => {
    // clear the search bar
    setSearch("");
    setDebouncedSearch("");
  };
  // showSuggestionPanel if the search results are more than 0
  const showSuggestionPanel = search.length > 0;

  return (
    <div className="relative">
      <div className="ml-1.5 border border-slate-700 bg-slate-900 text-slate-300 rounded-2xl h-[1.875rem] w-[16rem] flex items-center gap-2 px-3 focus-within:border-slate-500 transition-colors">
        <Search size={16} className="shrink-0 text-slate-500" />
        <input
          className="outline-none bg-transparent text-sm w-full placeholder-slate-500"
          placeholder="Search anime..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {showSuggestionPanel && (
        <div className="absolute z-100 left-0 right-0 mt-1 bg-slate-900 text-xs rounded-lg shadow-lg border border-slate-700 overflow-hidden">
          {isFetching && !suggestions.length ? (
            <p className="px-3 py-2 text-slate-400">Searching...</p>
          ) : suggestions.length ? (
            suggestions.map((anime) => {
              // get the title name to pass in, make sure structured and fallback are inplace
              const title =
                anime.title.english ||
                anime.title.romaji ||
                anime.title.native ||
                "Untitled";
              return (
                <Link
                  to={`/anime/${anime.id}`}
                  key={`suggestion-${anime.id}`}
                  onClick={() => handleSuggestionClick()}
                  className="flex items-center gap-3 w-full px-3 py-3 text-left text-slate-100 hover:bg-[#0d3853] transition-colors"
                >
                  {anime.coverImage?.medium && (
                    <img
                      src={anime.coverImage.medium}
                      alt={title}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <span className="text-[0.95rem] truncate">{title}</span>
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-2 text-slate-400">No matches yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
