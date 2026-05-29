import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AniListMedia } from "@/schemas/animeSchemas";
import { useAuthContext } from "@/services/supabase/hooks/AuthProvider";
import {
  addToWatchlist,
  getWatchlistStatus,
  removeFromWatchlist,
} from "@/services/api/userWatchlistService";

const DEFAULT_WATCHLIST_STATUS = "plan_to_watch" as const;

export function useWatchlistToggle(anime: AniListMedia) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const statusQueryKey = ["watchlistStatus", anime.id] as const;

  const { data: statusData } = useQuery({
    queryKey: statusQueryKey,
    queryFn: () => getWatchlistStatus(anime.id),
    enabled: Boolean(user) && anime.id > 0,
    retry: false,
  });

  const isInWatchlist = statusData?.in_watchlist ?? false;

  const mutation = useMutation({
    mutationFn: async (currentlyInWatchlist: boolean) => {
      if (currentlyInWatchlist) {
        return removeFromWatchlist(anime.id);
      }

      const title =
        anime.title.english ??
        anime.title.romaji ??
        anime.title.native ??
        "Unknown title";

      return addToWatchlist(anime.id, {
        anime_id: anime.id,
        title,
        genres: anime.genres ?? [],
        status: DEFAULT_WATCHLIST_STATUS,
      });
    },
    onMutate: async (currentlyInWatchlist) => {
      await queryClient.cancelQueries({ queryKey: statusQueryKey });
      const previousStatus = queryClient.getQueryData(statusQueryKey);

      queryClient.setQueryData(statusQueryKey, {
        anime_id: anime.id,
        in_watchlist: !currentlyInWatchlist,
        status: currentlyInWatchlist ? null : DEFAULT_WATCHLIST_STATUS,
      });

      return { previousStatus, currentlyInWatchlist };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(statusQueryKey, context.previousStatus);
      }
      toast.error("Could not update watchlist");
    },
    onSuccess: (_data, currentlyInWatchlist) => {
      toast.success(
        currentlyInWatchlist
          ? "Removed from watchlist"
          : "Added to watchlist",
      );
      queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
      queryClient.invalidateQueries({ queryKey: statusQueryKey });
    },
  });

  const toggleWatchlist = () => mutation.mutate(isInWatchlist);

  return {
    isInWatchlist,
    isPending: mutation.isPending,
    toggleWatchlist,
  };
}
