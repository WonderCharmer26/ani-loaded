import DiscussionBodySection from "@/components/forms/DiscussionBodySection";
import DiscussionAnimeSearchSection from "@/components/forms/DiscussionAnimeSearchSection";
import DiscussionCategorySection from "@/components/forms/DiscussionCategorySection";
import DiscussionEpisodeNumberSection from "@/components/forms/DiscussionEpisodeNumberSection";
import DiscussionSeasonNumberSection from "@/components/forms/DiscussionSeasonNumberSection";
import DiscussionThumbnailSection from "@/components/forms/DiscussionThumbnailSection";
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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// TODO: send user token with request when sending the form, have backend handle the validation and adding the username
// TODO: MAKE THE USER NAVIGATE BACK TO THE DISCUSSION PAGE
// TODO: LOOK INTO HOW THE TANSTACK FORM WORK WITH DATA MUTATION

export default function DiscussionSubmitPage() {
  // houses current selectedAnime
  const [selectedAnime, setSelectedAnime] = useState<AniListMedia | null>(null);

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

          // NOTE: might just clear the form and keep the user there
          navigate("/discussions");
          // navigate back to the list of discussions
        }
      } catch (error) {
        toast.error(`Discussion submition failed: ${error}`);
      }
    },
  });

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-white">New Discussion</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault(); // prevent form refresh on submit
            event.stopPropagation(); // make sure that the individual child components are handled
            form.handleSubmit(); // submit function
          }}
          className="space-y-6"
        >
          {/* Different sections of the form */}
          <DiscussionThumbnailSection form={form} />
          <DiscussionAnimeSearchSection
            form={form}
            onAnimeSelect={setSelectedAnime}
          />
          <DiscussionEpisodeNumberSection form={form} />
          <DiscussionSeasonNumberSection form={form} />
          <DiscussionCategorySection form={form} />
          <DiscussionTitleSection form={form} />
          <DiscussionBodySection form={form} />
          <DiscussionToggleSection form={form} />

          {/* Submit button */}
          {/* Handles the state of the button based on the form*/}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="rounded-xl bg-black px-4 py-2 font-semibold text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
