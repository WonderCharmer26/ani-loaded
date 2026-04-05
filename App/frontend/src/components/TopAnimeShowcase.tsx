import { getDisplayTitle } from "@/schemas/animeSchemas";
import type { UserListResponse } from "@/schemas/zod/listFormSchema";
import { Link } from "react-router-dom";

interface TopAnimeListShowcaseProps {
  list: UserListResponse;
  username?: string;
}

export default function TopAnimeListShowcase({
  list,
  username,
}: TopAnimeListShowcaseProps) {
  const displayUsername = username ?? list.owner_id;

  const topEntries = [...list.user_list_entry]
    .sort((a, b) => {
      if (a.rank == null && b.rank == null) {
        return 0;
      }
      if (a.rank == null) {
        return 1;
      }
      if (b.rank == null) {
        return -1;
      }
      return a.rank - b.rank;
    })
    .slice(0, 5)
    .map((entry, index) => {
      const title =
        entry.anime?.title && getDisplayTitle(entry.anime.title)
          ? getDisplayTitle(entry.anime.title)
          : `Anime #${entry.anime_id}`;

      return {
        id: entry.id,
        animeId: entry.anime_id,
        rank: entry.rank ?? index + 1,
        title,
        coverImage:
          entry.anime?.coverImage?.extraLarge ??
          entry.anime?.coverImage?.large ??
          entry.anime?.coverImage?.medium ??
          "",
      };
    });

  return (
    <div className="w-full flex-col">
      {/* List header */}
      <div className="flex items-start ">
        <div className="mb-1">
          <p className="font-bold text-[32px] text-white leading-tight">
            {displayUsername}'s
          </p>
          <p className="font-medium text-[20px] flex items-start text-[#9a9a9a] tracking-wide mt-0.5">
            TOP 5 ANIME
          </p>
        </div>
      </div>

      {/* Anime cards row */}
      <div className="flex gap-[13px]">
        {topEntries.map((entry) => (
          <Link
            key={entry.id}
            to={`/anime/${entry.animeId}`}
            aria-label={`View ${entry.title}`}
            className="relative flex-1 pt-[25px] transition-transform duration-200 ease-out hover:scale-[1.01]"
          >
            {/* Rank badge */}
            <div className="absolute top-0 -right-5 -translate-x-1/12 w-[70px] h-[70px] rounded-full bg-[#101114] border-2 border-slate-700 flex items-center justify-center z-10">
              <span className="font-bold text-[36px] text-white leading-none">
                {entry.rank}
              </span>
            </div>

            {/* Cover image */}
            {entry.coverImage ? (
              <img
                src={entry.coverImage}
                alt={entry.title}
                className="w-full h-[384px] object-cover rounded-[38px]"
              />
            ) : (
              <div className="w-full h-[384px] rounded-[38px] bg-slate-800/70 border border-slate-700 flex items-center justify-center px-4 text-center text-slate-300">
                {entry.title}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
