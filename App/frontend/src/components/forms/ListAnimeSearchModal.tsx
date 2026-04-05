import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AniListMedia } from "@/schemas/animeSchemas";
import { getDisplayTitle } from "@/schemas/animeSchemas";
import { getAnimeByCategory } from "@/services/api/animeCategoriesService";

interface ListAnimeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (anime: AniListMedia) => void;
  excludedIds?: number[];
}

const SEARCH_DELAY_MS = 300;
const SEARCH_RESULTS_LIMIT = 6;

export default function ListAnimeSearchModal({
  isOpen,
  onClose,
  onAdd,
  excludedIds = [],
}: ListAnimeSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
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
          search: trimmed,
          page: 1,
          perPage: SEARCH_RESULTS_LIMIT,
        });

        if (isCancelled) return;

        setResults(response.data.Page.media ?? []);
      } catch (fetchError) {
        if (isCancelled) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to search anime",
        );
        setResults([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  if (!isOpen) return null;

  const filteredResults = results.filter(
    (anime) => !excludedIds.includes(anime.id),
  );

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#101114] border border-slate-700 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Add Anime</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an anime..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
        />

        {/* Results */}
        <div className="mt-3 min-h-[60px]">
          {isLoading && (
            <p className="text-xs text-slate-400 py-2">Searching...</p>
          )}

          {error && <p className="text-xs text-red-400 py-2">{error}</p>}

          {!isLoading && query.trim() && !error && (
            <div className="max-h-72 overflow-y-auto space-y-1 rounded-lg border border-slate-800 bg-slate-900 p-2">
              {filteredResults.length ? (
                filteredResults.map((anime) => {
                  const title =
                    getDisplayTitle(anime.title) || `Anime #${anime.id}`;
                  return (
                    <button
                      key={anime.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-800 transition-colors"
                      onClick={() => {
                        onAdd(anime);
                        onClose();
                      }}
                    >
                      {anime.coverImage?.medium ? (
                        <img
                          src={anime.coverImage.medium}
                          alt={title}
                          className="h-12 w-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-8 rounded bg-slate-700 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-100 line-clamp-2">
                        {title}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-2 py-1 text-sm text-slate-400">
                  No anime found.
                </p>
              )}
            </div>
          )}

          {!query.trim() && (
            <p className="text-xs text-slate-500 py-2">
              Start typing to search for anime.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
