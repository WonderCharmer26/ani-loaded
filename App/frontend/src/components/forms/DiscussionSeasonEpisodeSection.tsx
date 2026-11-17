import { seasonToMedia } from "@/schemas/animeSchemas";
import type { AniListMedia, AnimeSeasonsResponse } from "@/schemas/animeSchemas";
import { getAnimeSeasons } from "@/services/api/fetchAnimes";
import { DiscussionFormApi } from "@/types/discussionForm";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import DiscussionDropdownPill from "./DiscussionDropdownPill";

type DiscussionSeasonEpisodeSectionProps = {
  form: DiscussionFormApi;
  // the anime picked from search, seasons are looked up from its franchise
  animeId: number;
  // each season is its own AniList entry, so picking one swaps the linked anime
  onSeasonAnimeChange: (anime: AniListMedia) => void;
};

const SEASONS_STALE_TIME_MS = 30 * 60 * 1000; // matches the backend cache

// "" in a select means nothing picked, the form stores that as undefined
const toNumber = (value: string) => (value === "" ? undefined : Number(value));

// season + episode dropdowns, filled from the picked anime's franchise
export default function DiscussionSeasonEpisodeSection({
  form,
  animeId,
  onSeasonAnimeChange,
}: DiscussionSeasonEpisodeSectionProps) {
  const { data, isLoading, isError } = useQuery<AnimeSeasonsResponse>({
    queryKey: ["animeSeasons", animeId],
    queryFn: () => getAnimeSeasons(animeId),
    staleTime: SEASONS_STALE_TIME_MS,
  });

  // start on the season of the anime the user picked
  useEffect(() => {
    if (data && form.getFieldValue("season_number") === undefined) {
      form.setFieldValue("season_number", data.current_season);
    }
  }, [data, form]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5" aria-busy="true">
        <span className="h-7.5 w-14 animate-pulse rounded-lg bg-[#1A212C]" />
        <span className="h-7.5 w-16 animate-pulse rounded-lg bg-[#1A212C]" />
      </div>
    );
  }

  // season/episode are optional, so if the lookup fails just leave them out
  if (isError || !data?.seasons.length) return null;

  return (
    <form.Field
      name="season_number"
      children={(seasonField) => {
        const season = data.seasons.find(
          (item) => item.season_number === seasonField.state.value,
        );
        const episodeCount = season?.aired_episodes ?? 0;

        return (
          <div className="flex shrink-0 items-center gap-1.5">
            <DiscussionDropdownPill
              id={seasonField.name}
              prefix="S"
              label="Season"
              value={seasonField.state.value?.toString() ?? ""}
              displayValue={seasonField.state.value?.toString() ?? "–"}
              options={data.seasons.map((item) => ({
                value: item.season_number.toString(),
                label: [
                  `Season ${item.season_number}`,
                  item.season_year,
                  item.aired_episodes === 0 ? "not aired yet" : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
                // can't discuss episodes of a season that hasn't aired
                disabled:
                  item.aired_episodes === 0 &&
                  item.season_number !== data.current_season,
              }))}
              onChange={(value) => {
                const nextSeason = toNumber(value);
                seasonField.handleChange(nextSeason);

                const picked = data.seasons.find(
                  (item) => item.season_number === nextSeason,
                );
                if (picked) onSeasonAnimeChange(seasonToMedia(picked));

                // drop the episode if the new season doesn't have it
                const episode = form.getFieldValue("episode_number");
                if (episode !== undefined && episode > (picked?.aired_episodes ?? 0)) {
                  form.setFieldValue("episode_number", undefined);
                }
              }}
            />

            <form.Field
              name="episode_number"
              children={(episodeField) => (
                <DiscussionDropdownPill
                  id={episodeField.name}
                  prefix="EP"
                  label="Episode (optional)"
                  value={episodeField.state.value?.toString() ?? ""}
                  displayValue={episodeField.state.value?.toString() ?? "–"}
                  disabled={episodeCount === 0}
                  options={[
                    { value: "", label: "No specific episode" },
                    ...Array.from({ length: episodeCount }, (_, index) => ({
                      value: (index + 1).toString(),
                      label: `Episode ${index + 1}`,
                    })),
                  ]}
                  onChange={(value) => episodeField.handleChange(toNumber(value))}
                />
              )}
            />
          </div>
        );
      }}
    />
  );
}
