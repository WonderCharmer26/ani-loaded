import DiscussionBodySection from "@/components/forms/DiscussionBodySection";
import DiscussionAnimeSearchSection from "@/components/forms/DiscussionAnimeSearchSection";
import DiscussionCategorySection from "@/components/forms/DiscussionCategorySection";
import DiscussionSeasonEpisodeSection from "@/components/forms/DiscussionSeasonEpisodeSection";
import DiscussionThumbnailSection, {
  useThumbnailDrop,
} from "@/components/forms/DiscussionThumbnailSection";
import DiscussionTitleSection from "@/components/forms/DiscussionTitleSection";
import DiscussionToggleSection from "@/components/forms/DiscussionToggleSection";
import {
  DiscussionSchema,
  DiscussionValues,
} from "@/schemas/zod/discussionFormSchema";
import type { AniListMedia } from "@/schemas/animeSchemas";
import { submitDiscussion } from "@/services/api/discussionService";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// TODO: send user token with request when sending the form, have backend handle the validation and adding the username
// TODO: LOOK INTO HOW THE TANSTACK FORM WORK WITH DATA MUTATION

const DISCUSSIONS_LINK = "/discussions";

export default function DiscussionSubmitPage() {
  // houses current selectedAnime (changes when a different season is picked)
  const [selectedAnime, setSelectedAnime] = useState<AniListMedia | null>(null);
  // the anime picked from search, its franchise drives the season dropdown
  const [searchedAnimeId, setSearchedAnimeId] = useState<number | null>(null);

  // for set up of naviagation to main page
  const navigate = useNavigate();

  // for query invalidation
  const queryClient = useQueryClient();

  // set up the default values for the form
  const defaultValues: DiscussionValues = {
    anime_id: 0,
    category_id: "55555555-5555-5555-5555-555555555555", // value if the category picked
    title: "",
    body: "",
    episode_number: undefined,
    season_number: undefined,
    thumbnail: null, // incase user doesn't post a thumbnail
    is_spoiler: false,
    is_locked: false,
  };

  // set up the form with Zod validation wired into TanStack Form
  const form = useForm({
    defaultValues,
    // Zod schema validates fields on blur to avoid noisy global errors while typing
    validators: {
      onBlur: DiscussionSchema,
    },
    // onSubmit only fires when validation passes
    onSubmit: async ({ value }) => {
      try {
        // submit the Discussion
        // TODO: SEE IF THERE IS A WAY TO VALIDATE THUMBNAILS
        const submitted = await submitDiscussion({
          anime_id: value.anime_id,
          title_romaji: selectedAnime?.title?.romaji ?? undefined,
          title_english: selectedAnime?.title?.english ?? undefined,
          cover_image_url:
            selectedAnime?.coverImage?.large ??
            selectedAnime?.coverImage?.medium ??
            undefined,
          status: selectedAnime?.status ?? undefined,
          season: selectedAnime?.season ?? undefined,
          season_year: selectedAnime?.seasonYear ?? undefined,
          thumbnail: value.thumbnail,
          category_id: value.category_id,
          title: value.title,
          body: value.body,
          episode_number: value.episode_number,
          season_number: value.season_number,
          is_spoiler: value.is_spoiler,
          is_locked: value.is_locked,
        });

        if (submitted) {
          // invalidate the query key for discussions to trigger refresh
          queryClient.invalidateQueries({ queryKey: ["discussions"] });

          // notify the user
          toast("Your discussion has been posted");

          // navigate back to the list of discussions
          navigate(DISCUSSIONS_LINK);
        }
      } catch (error) {
        toast.error(`Discussion submition failed: ${error}`);
      }
    },
  });

  // the whole composer card accepts a dropped cover image
  const { isDragging, dropError, setDropError, dropHandlers } =
    useThumbnailDrop(form);

  // season/episode belong to the picked anime, so clear them when it changes
  const handleAnimeSelect = (anime: AniListMedia | null) => {
    setSelectedAnime(anime);
    setSearchedAnimeId(anime?.id ?? null);
    form.setFieldValue("season_number", undefined);
    form.setFieldValue("episode_number", undefined);
  };

  // picking another season links the discussion to that season's own entry
  const handleSeasonAnimeChange = (anime: AniListMedia) => {
    setSelectedAnime(anime);
    form.setFieldValue("anime_id", anime.id);
  };

  return (
    <div className="px-4 pt-10 pb-24 sm:pt-14">
      <div className="mx-auto flex max-w-180 flex-col gap-7 text-left">
        <h1 className="font-geist! text-3xl/9! font-bold! tracking-[-0.025em] text-[#F3F5F9] sm:text-[40px]/11!">
          Start a discussion
        </h1>

        <form
          onSubmit={(event) => {
            event.preventDefault(); // prevent form refresh on submit
            event.stopPropagation(); // make sure that the individual child components are handled
            form.handleSubmit(); // submit function
          }}
        >
          {/* Composer card */}
          <div
            {...dropHandlers}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-[#141922]"
          >
            <DiscussionAnimeSearchSection
              form={form}
              selectedAnime={selectedAnime}
              onAnimeSelect={handleAnimeSelect}
            />

            {/* Category + season/episode (only once an anime is picked) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
              <DiscussionCategorySection form={form} />
              {searchedAnimeId ? (
                <DiscussionSeasonEpisodeSection
                  key={searchedAnimeId}
                  form={form}
                  animeId={searchedAnimeId}
                  onSeasonAnimeChange={handleSeasonAnimeChange}
                />
              ) : null}
            </div>

            {/* Writing area */}
            <div className="flex flex-col gap-3 px-4 pt-6 pb-5 sm:px-5">
              <DiscussionThumbnailSection
                form={form}
                dropError={dropError}
                onDropErrorChange={setDropError}
              />
              <DiscussionTitleSection form={form} />
              <DiscussionBodySection form={form} />
            </div>

            {/* Footer: toggles + actions */}
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 bg-[#101114] px-4 py-3.5 sm:px-5">
              <DiscussionToggleSection form={form} />

              <div className="ml-auto flex items-center gap-4">
                <form.Subscribe selector={(state) => state.values.body.length}>
                  {(bodyLength) => (
                    <span className="hidden font-geist-mono text-[11px]/4 text-[#5A6474] sm:inline">
                      {bodyLength} chars
                    </span>
                  )}
                </form.Subscribe>
                <Link
                  to={DISCUSSIONS_LINK}
                  className="font-geist text-sm/5 font-medium text-[#97A3B8] transition-colors hover:text-[#E4E8F0]"
                >
                  Cancel
                </Link>

                {/* Handles the state of the button based on the form*/}
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="rounded-full bg-[#4DA3F0] px-4.5 py-2 font-geist text-sm/5 font-semibold text-[#06101C] transition-colors hover:bg-[#6AB4F4] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? "Posting…" : "Post discussion"}
                    </button>
                  )}
                </form.Subscribe>
              </div>
            </div>

            {/* Drop overlay while dragging a file over the card */}
            {isDragging ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#4DA3F0]/8 ring-2 ring-[#4DA3F0] ring-inset">
                <span className="rounded-full bg-[#0C0E12]/90 px-3.5 py-1.5 font-geist text-[13px]/4.5 font-medium text-[#CFE6FB]">
                  Drop to set as cover
                </span>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
