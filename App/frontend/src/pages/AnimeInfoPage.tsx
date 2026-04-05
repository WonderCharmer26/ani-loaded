// TODO: make sure that the banner from the backend is able to get close to the figma design
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom"; // used to get the anime to make sure its routed to the right page
import { getAnimeInfo, getTrending } from "../services/api/fetchAnimes";
import { AniListMedia } from "../schemas/animeSchemas";
import { ShowcaseSection } from "../components/ShowcaseSection";
import { ReviewList } from "../components/ReviewList";
import { AnimeBanner } from "../components/AnimeBanner";
import { AnimeBannerSkeleton } from "../components/skeleton/AnimeBannerSkeleton";
import { useEffect } from "react";
import { sanitizeHtml } from "../utilities/htmlUtils";
import { ApiServiceError } from "../components/ApiServiceError";

// TODO: USE ANILIST RECOMMENDATION EDGE TO HELP WITH GIVING RECOMMENDATIONS FOR EACH OF THE DIFFERENT ANIME ON THE INFO PAGE

// TODO: Incorporate beautiful soup to make sure that the data gotten from the backend is packaged and rendered properly on the frontend
export default function AnimeInfoPage() {
  const { id } = useParams();
  const anime_id = Number(id);
  const isValidAnimeId = Number.isInteger(anime_id) && anime_id > 0;

  // scrolls to the top of the page when new anime loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [anime_id]);

  // function gets the anime info
  const {
    data,
    isFetched,
    isLoading,
    isError,
    error,
    refetch: refetchAnimeInfo,
  } = useQuery<AniListMedia, Error>({
    queryKey: ["animeInfo", anime_id],
    queryFn: () => getAnimeInfo(anime_id),
    enabled: isValidAnimeId,
  });

  // make a query to get the trending anime
  // WARNING: make error states and loading states
  const {
    data: trendingAnime,
    error: trendingError,
    refetch: refetchTrending,
  } = useQuery<AniListMedia[], Error>({
    queryKey: ["trendingAnime"],
    queryFn: getTrending,
  });

  // builds and array of anime
  const featuredAnime = Array.isArray(trendingAnime) ? trendingAnime : [];

  // handle case when the anime id isn't valid
  if (!isValidAnimeId) {
    return <p>Invalid anime ID</p>;
  }

  // error handling
  if (isError) {
    return (
      <ApiServiceError
        title="AniList is temporarily unavailable"
        message={error?.message ?? "Failed to load anime details."}
        onRetry={() => {
          void refetchAnimeInfo();
        }}
      />
    );
  }

  if (trendingError) {
    return (
      <ApiServiceError
        title="AniList is temporarily unavailable"
        message={trendingError.message}
        onRetry={() => {
          void refetchTrending();
        }}
      />
    );
  }

  // skeleton to show for the banner
  if (isLoading) {
    return <AnimeBannerSkeleton />;
  }

  // TODO: Figure out why the data. is giving errors
  return (
    <div>
      {/* if the data is fetched correctly display the information for the page */}
      {isFetched && data && <AnimeBanner anime={data} />}
      {/* TODO: make a style for if there is no bannerImage */}
      {/* NOTE: THIS IS THE MIDDLE SECTION */}
      <div className="mt-10 flex flex-row gap-4">
        {/* NOTE: This is the plot section */}
        <div className="flex flex-col w-[600px]">
          <div className="w-full flex items-start">
            <h2 className="section-titles">PLOT</h2>
          </div>
          <div className="h-[250px] w-[700px] mt-2 no-scrollbar overflow-scroll">
            {/*Handles the raw html data from anilist to make sure its displayed propper*/}
            {isFetched && data?.description && data.description?.length > 0 ? (
              <div
                className="flex text-start flex-col whitespace-pre-line"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(data.description),
                }}
              />
            ) : (
              "there is no description"
            )}
          </div>
        </div>
        {/* NOTE: This is the characters section */}
        {/* NOTE: Might animate the character section*/}
        <div className="flex flex-col items-end w-full ">
          <div className="">
            <div>
              <h2 className="section-titles">CHARACTERS</h2>
            </div>
            {/* NOTE: This is where the characters and voice actors will be displayed */}
            <div>
              {isFetched && data?.characters?.edges?.length ? (
                <ul className="mt-4 flex items-center max-h-[470px] max-w-full flex-col gap-3 overflow-y-auto no-scrollbar">
                  {data.characters.edges.map((edge) => {
                    // variable names to house incase the names of th characters don't render properly
                    const characterName =
                      edge.node.name?.full ??
                      edge.node.name?.romaji ??
                      edge.node.name?.native ??
                      "Unknown";
                    const imageSrc =
                      edge.node.image?.large ?? edge.node.image?.medium ?? "";
                    const primaryVoiceActor = edge.voiceActors?.[0];
                    const voiceActorName = primaryVoiceActor
                      ? (primaryVoiceActor.name?.full ??
                        primaryVoiceActor.name?.romaji ??
                        primaryVoiceActor.name?.native ??
                        "Unknown")
                      : "N/A";

                    return (
                      <li
                        key={edge.node.id}
                        className="flex items-center relative w-md gap-4 rounded-xl bg-[#1A2227] p-3.5 cursor-pointer"
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={characterName}
                            className="h-21 w-25 absolute left-0 flex-shrink-0 rounded-l-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 flex-shrink-0 absolute left-0  items-center justify-center rounded-l-xl bg-[#26242A] text-lg font-semibold">
                            {characterName.charAt(0)}
                          </div>
                        )}
                        <div className="flex flex-1 flex-col items-center gap-1 text-center">
                          <span className="text-lg font-semibold">
                            {characterName}
                          </span>
                          <span className="text-sm uppercase tracking-wide text-[#246C99]">
                            {/* {edge.role ?? "—"} */}
                          </span>
                          <span className="text-sm text-gray-300">
                            {voiceActorName}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div>There are no characters</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* NOTE: This section will show the featured anime */}
      <section className="mt-14">
        <div>
          {featuredAnime.length ? (
            <ShowcaseSection
              sectionName="Featured Anime"
              cards={featuredAnime}
            />
          ) : (
            "nothing to show"
          )}
        </div>
      </section>
      <section>
        <ReviewList />
      </section>
    </div>
  );
}
