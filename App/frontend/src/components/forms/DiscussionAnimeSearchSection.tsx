import { getDisplayTitle } from "@/schemas/animeSchemas";
import type { AniListMedia } from "@/schemas/animeSchemas";
import { getAnimeByCategory } from "@/services/api/animeCategoriesService";
import { DiscussionFormApi } from "@/types/discussionForm";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFieldErrorMessage } from "./getFieldErrorMessage";

type DiscussionAnimeSearchSectionProps = {
  form: DiscussionFormApi;
  // owned by the page so the season dropdown can swap it to another season's entry
  selectedAnime: AniListMedia | null;
  onAnimeSelect: (anime: AniListMedia | null) => void;
};

type AnimeFieldApi = {
  state: {
    value: number;
    meta: {
      errors?: unknown[];
    };
  };
  handleBlur: () => void;
  handleChange: (value: number) => void;
};

const SEARCH_DELAY_MS = 300;
const SEARCH_RESULTS_LIMIT = 6;

// "2023 · 28 eps · Adventure, Fantasy" line under the anime title
const getAnimeMeta = (anime: AniListMedia) =>
  [
    anime.seasonYear,
    anime.episodes ? `${anime.episodes} eps` : null,
    anime.genres?.slice(0, 2).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

function AnimeCover({ anime, className }: { anime: AniListMedia; className: string }) {
  const src = anime.coverImage?.medium ?? anime.coverImage?.large;

  return src ? (
    <img src={src} alt="" className={`shrink-0 object-cover ${className}`} />
  ) : (
    <div className={`shrink-0 bg-[#2A3342] ${className}`} />
  );
}

function AnimeField({
  field,
  selectedAnime,
  onAnimeSelect,
}: {
  field: AnimeFieldApi;
  selectedAnime: AniListMedia | null;
  onAnimeSelect: (anime: AniListMedia | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAnimeByCategory({
          search: trimmedQuery,
          page: 1,
          perPage: SEARCH_RESULTS_LIMIT,
        });

        if (isCancelled) {
          return;
        }

        setResults(response.data.Page.media ?? []);
      } catch (fetchError) {
        if (isCancelled) {
          return;
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to search anime";

        setResults([]);
        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const fieldError = getFieldErrorMessage(field.state.meta.errors?.[0]);

  const selectAnime = (anime: AniListMedia) => {
    field.handleChange(anime.id);
    // re-run the blur validation, the search input blurred while no anime was picked yet
    field.handleBlur();
    setQuery("");
    setResults([]);
    onAnimeSelect(anime);
  };

  const clearAnime = () => {
    field.handleChange(0);
    onAnimeSelect(null);
    // wait for the input to render again before focusing it
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  // selected state: "Discussing" header with the anime's cover
  if (selectedAnime && field.state.value > 0) {
    const meta = getAnimeMeta(selectedAnime);

    return (
      <div className="flex items-center gap-3.5 px-4 py-4 sm:px-5">
        <AnimeCover anime={selectedAnime} className="h-14 w-10 rounded-md" />
        <div className="flex min-w-0 grow flex-col gap-0.75">
          <span className="font-['Inter'] text-[11px]/4 font-semibold tracking-[0.08em] text-[#6B7688]">
            DISCUSSING
          </span>
          <span className="truncate font-geist text-base/5.5 font-semibold text-[#F3F5F9]">
            {getDisplayTitle(selectedAnime.title) || `Anime #${selectedAnime.id}`}
          </span>
          {meta ? (
            <span className="truncate font-geist text-[13px]/4.5 text-[#7E8899]">
              {meta}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={clearAnime}
          className="shrink-0 rounded-md px-1.5 py-1 font-geist text-[13px]/4.5 font-medium text-[#4DA3F0] transition-colors hover:text-[#8CC4F5]"
        >
          Change
        </button>
      </div>
    );
  }

  // search state: input with inline results
  const trimmedQuery = query.trim();

  return (
    <div className="flex flex-col">
      <label
        htmlFor="anime-search"
        className="flex items-center gap-3 px-4 py-4 sm:px-5"
      >
        <Search className="size-4.5 shrink-0 text-[#6B7688]" strokeWidth={1.9} />
        <input
          ref={inputRef}
          id="anime-search"
          value={query}
          autoComplete="off"
          onBlur={field.handleBlur}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Which anime is this about?"
          className="w-full bg-transparent font-geist text-base/6 font-medium text-[#F3F5F9] placeholder:font-normal placeholder:text-[#5F6A7B] focus:outline-none"
        />
        {isLoading ? (
          <span className="shrink-0 font-geist-mono text-[11px]/4 text-[#5A6474]">
            searching…
          </span>
        ) : null}
      </label>

      {error ? (
        <span className="block px-5 pb-3 font-geist text-xs text-red-400">{error}</span>
      ) : null}

      {!isLoading && trimmedQuery && !error ? (
        <div className="flex max-h-72 flex-col overflow-y-auto px-2 pb-2">
          {results.length ? (
            results.map((anime) => {
              const meta = getAnimeMeta(anime);

              return (
                <button
                  key={anime.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-[#1A212C] focus-visible:bg-[#1A212C] focus-visible:outline-none"
                  onClick={() => selectAnime(anime)}
                >
                  <AnimeCover anime={anime} className="h-11 w-8 rounded" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-geist text-sm/5 font-semibold text-[#E4E8F0]">
                      {getDisplayTitle(anime.title) || `Anime #${anime.id}`}
                    </span>
                    {meta ? (
                      <span className="truncate font-geist text-xs/4 text-[#7E8899]">
                        {meta}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="block px-3 py-2 font-geist text-sm text-[#7E8899]">
              No anime found.
            </span>
          )}
        </div>
      ) : null}

      {fieldError ? (
        <span className="block px-5 pb-3 font-geist text-sm text-red-400">{fieldError}</span>
      ) : null}
    </div>
  );
}

export default function DiscussionAnimeSearchSection({
  form,
  selectedAnime,
  onAnimeSelect,
}: DiscussionAnimeSearchSectionProps) {
  return (
    <form.Field name="anime_id">
      {(field: AnimeFieldApi) => (
        <AnimeField
          field={field}
          selectedAnime={selectedAnime}
          onAnimeSelect={onAnimeSelect}
        />
      )}
    </form.Field>
  );
}
