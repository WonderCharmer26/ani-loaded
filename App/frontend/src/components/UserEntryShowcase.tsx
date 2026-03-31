import { getDisplayTitle } from "@/schemas/animeSchemas";
import type { UserListResponse } from "@/schemas/zod/listFormSchema";
import { Link } from "react-router-dom";

interface UserEntryShowcaseProps {
  list: UserListResponse;
  username?: string;
}

export default function UserEntryShowcase({
  list,
  username,
}: UserEntryShowcaseProps) {
  const displayUsername = username ?? list.owner_id;

  const entries = [...list.user_list_entry]
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
        episodes: entry.anime?.episodes,
        status: entry.anime?.status,
        studios: entry.anime?.studios?.nodes ?? [],
        averageScore: entry.anime?.averageScore,
        coverImage:
          entry.anime?.coverImage?.extraLarge ??
          entry.anime?.coverImage?.large ??
          entry.anime?.coverImage?.medium ??
          "",
      };
    });

  return (
    <div className="w-full flex-col relative">
      <div className="flex items-start ">
        <div className="mb-1">
          <p className="font-bold text-[32px] text-white leading-tight">
            {displayUsername}'s
          </p>
          <div className="flex h-5 items-center">
            <Link
              to={`/list/${list.id}`}
              className="font-medium text-[20px] flex items-start text-[#9a9a9a] tracking-wide mt-0.5 uppercase hover:text-white transition-colors"
            >
              {list.title}
            </Link>
            <p className="absolute font-bold right-0 opacity-25">
              Entries {list.user_list_entry.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-[13px] overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            to={`/anime/${entry.animeId}`}
            aria-label={`View ${entry.title}`}
            className="group relative pt-[25px] transition-transform duration-200 ease-out hover:scale-[1.01] shrink-0 w-[240px]"
          >
            <div className="absolute top-0 -right-5 -translate-x-1/12 w-[70px] h-[70px] rounded-full bg-[#101114] border-2 border-slate-700 flex items-center justify-center z-10">
              <span className="font-bold text-[36px] text-white leading-none">
                {entry.rank}
              </span>
            </div>

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

            <div className="absolute opacity-0 bg-black/70 inset-0 top-[25px] rounded-[38px] transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
              <div className="absolute opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-y-1 inset-x-0 p-4">
                <div>
                  <p className="text-lg font-bold text-white">{entry.title}</p>
                  <p className="text-white">{`Episodes: ${entry.episodes}`}</p>
                  <p className="text-white">{entry.status}</p>

                  {entry.studios.map((studio) => (
                    <div key={studio.id} className="text-white">
                      {studio.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-2 left-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-4xl border-[6px] border-[#3CB4FF] text-2xl font-bold mr-2 text-white">
                  {entry.averageScore}
                </div>
              </div>

              {/* <div className="absolute bottom-2 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"> */}
              {/*   <div className="flex h-10 w-10 items-center justify-center bg-black/50 text-white"> */}
              {/*     <Plus size={25} /> */}
              {/*   </div> */}
              {/* </div> */}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
