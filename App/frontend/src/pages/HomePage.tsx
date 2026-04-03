// TODO: have skeleton loader to load the elements onto the page when the data is loading
// TODO: remember to make a query to the anime that is linked in the anime carousel using the anime page
import { CarouselComponent } from "../components/Carousel";
import { ShowcaseSection } from "../components/ShowcaseSection";
import { useQuery } from "@tanstack/react-query";
import {
  getPopular,
  getTopAnime,
  getTrending,
} from "../services/api/fetchAnimes";
import { AniListMedia } from "../schemas/animeSchemas";
import { Link, useLoaderData } from "react-router-dom"; // use data from react router loader
import { adSchemaI } from "../schemas/adSchema";
import { getPosterAd } from "../services/supabase/getMainPagePhotos";
import { ReviewList } from "../components/ReviewList";
import { ApiServiceError } from "../components/ApiServiceError";

/*NOTE: might make the seperation bigger for ShowcaseSection, teak mt-6 higher */
// NOTE: gonna add the supabase user in here to account for when the user is logged in
// NOTE: add in prefetch to get the data before the component loads for the carousel component
export default function HomePage() {
  // NOTE: get the data from the homePageFetcher and pass it in to the data so that it's there when prefetched
  const loaderData = useLoaderData() as {
    trendingAnime: AniListMedia[];
    popularAnime: AniListMedia[];
    topAnime: AniListMedia[];
  };

  // const { dehydratedState } = useLoaderData() as { dehydratedState: unknown };

  // function for making a request to get trending anime
  // NOTE: might add a stale time to the fetches ( might be needed at all (small improvement))
  const {
    data: trendingAnime,
    error: trendingError,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useQuery<AniListMedia[], Error>({
    queryKey: ["trendingAnime"],
    queryFn: getTrending,
    // use initial data to get the prefetched data to use
    initialData: loaderData.trendingAnime,
  });

  // function for making a request to get the most popular anime
  // NOTE: might add a stale time to the fetches ( might be needed at all (small improvement))
  const {
    data: popularAnime,
    error: popularError,
    isLoading: popularLoading,
    refetch: refetchPopular,
  } = useQuery<AniListMedia[], Error>({
    queryKey: ["popularAnime"],
    queryFn: getPopular,
    // use initial data to get the prefetched data to use
    initialData: loaderData.popularAnime,
  });

  // TODO: make function to fetch the top anime to showcase in the carousel
  //TODO: handle the error and loading state
  // NOTE: might add a stale time to the fetches ( might be needed at all (small improvement))
  const {
    data: topAnime,
    error: topAnimeError,
    isLoading: topAnimeLoading,
    refetch: refetchTopAnime,
  } = useQuery<AniListMedia[], Error>({
    queryKey: ["topAnime"],
    queryFn: getTopAnime,
    // use initial data to get the prefetched data to use
    initialData: loaderData.topAnime,
  });

  // useQuery to get the data from supabase
  const {
    data: adData,
    error: adError,
    isFetched: adFetched,
    isLoading: adLoading,
  } = useQuery<adSchemaI[]>({ queryKey: ["ads"], queryFn: getPosterAd });

  if (trendingLoading || popularLoading || topAnimeLoading) {
    return <h1>Loading...</h1>;
  }

  const animeServiceError = trendingError || popularError || topAnimeError;
  if (animeServiceError) {
    return (
      <ApiServiceError
        title="AniList is temporarily unavailable"
        message={animeServiceError.message}
        onRetry={() => {
          void refetchTrending();
          void refetchPopular();
          void refetchTopAnime();
        }}
      />
    );
  }

  // log the data to test what I get back
  console.log(trendingAnime); // check the trending data;
  console.log(popularAnime); // check the popular data
  console.log(topAnime); // check the top anime

  // if data then set it to data, else set it to an empty array
  const trendingData = trendingAnime ? trendingAnime : [];
  const popularData = popularAnime ? popularAnime : [];
  const topAnimeData = topAnime ? topAnime : [];
  // const adFetchedData = adData ? adData : [];

  console.log(trendingData); // log the data to test
  console.log(popularData); // log the data to test

  return (
    <div>
      <section>
        <div className="mb-11">
          <CarouselComponent />
        </div>
      </section>
      {/* trending anime section here */}
      <section>
        <div>
          <ShowcaseSection sectionName="TRENDING ANIME" cards={trendingData} />
        </div>
      </section>
      {/* popular section for anime */}
      <section>
        <div>
          <ShowcaseSection sectionName="POPULAR ANIME" cards={popularData} />
        </div>
      </section>
      <section>
        <div>
          <ShowcaseSection sectionName="TOP RATED ANIME" cards={topAnimeData} />
        </div>
      </section>
      <section>
        {/* TODO: might turn into a component that loads the ads into it */}
        {/* TODO: make sure that this links to the sign up page */}
        {adFetched &&
          adData &&
          adData.length > 0 &&
          adData.map((ads) => (
            <Link to={"auth/signup"}>
              <div className="h-full w-full ">
                <img
                  key={ads.id}
                  alt={ads.title}
                  src={ads.url}
                  className="h-full w-full cursor-pointer"
                />
              </div>
            </Link>
          ))}
      </section>
      <section>
        {/* TODO: Make this section show some suggestion cards instead */}
        <ReviewList />
      </section>
      {/* TODO: show the different categories of animes from the backend with same card component */}
    </div>
  );
}
