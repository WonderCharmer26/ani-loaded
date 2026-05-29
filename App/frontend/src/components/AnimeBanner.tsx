import { AniListMedia } from "../schemas/animeSchemas";
import { Check, Star } from "lucide-react";

interface AnimeBannerProps {
  anime: AniListMedia;
  isInWatchlist: boolean;
  isPending: boolean;
  onToggleWatchlist: () => void;
}

export const AnimeBanner: React.FC<AnimeBannerProps> = ({
  anime,
  isInWatchlist,
  isPending,
  onToggleWatchlist,
}) => {
  if (!anime.bannerImage) {
    // NOTE: show replacement banner or show another style if there's no banner data
    return null;
  }

  const studioName =
    anime.studios && anime.studios.nodes?.length > 0
      ? anime.studios.nodes[0].name
      : "unknown";
  const genreLabel = anime.genres?.join(", ") ?? "";

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="absolute z-[1] bottom-3 left-2/7 md: left-5/16 flex w-full max-w-5xl -translate-x-1/2 flex-row scale-80 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-4xl border-[6px] border-[#3CB4FF] text-2xl font-bold mr-2">
          {anime.averageScore}
        </div>
        <div className="flex flex-col items-start">
          <h1 className="text-left">{anime.title.english?.toUpperCase()}</h1>
          <h2>Genre: {genreLabel}</h2>
          <p>Studio: {studioName}</p>
          <div className="flex flex-row items-center gap-2 mt-2">
            <button className="flex items-center justify-center bg-[#26242A] text-sm h-11 p-3 rounded-lg uppercase">
              add to list
            </button>
            <button
              type="button"
              onClick={onToggleWatchlist}
              disabled={isPending}
              className="flex items-center justify-center gap-2 bg-[#246C99] text-sm p-3 h-11 rounded-lg uppercase disabled:opacity-60"
            >
              {isPending ? (
                "updating..."
              ) : isInWatchlist ? (
                <>
                  <Check size={16} />
                  In Watchlist
                </>
              ) : (
                "add to watch list"
              )}
            </button>
            {/* NOTE: CHANGE THE FILL COLOR TO THE BLUE IF THE USER FAVORITES THE ANIME AND ADDS IT TO THEIR LIST */}
            <Star size={32} fill="white" />
          </div>
        </div>
      </div>

      <div className="brightness-50 bg-blue-400 h-[620px] w-full">
        <img src={anime.bannerImage} className="h-full w-full object-cover" />
      </div>

      {/* STYLING FOR THE OVERLAY WITH THE BG COLOR FADDED TO TRANSPARENT  */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[0] h-[35%] bg-gradient-to-t from-[#101114] to-transparent" />
    </div>
  );
};
