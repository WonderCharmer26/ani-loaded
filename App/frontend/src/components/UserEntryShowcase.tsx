import { getDisplayTitle } from "@/schemas/animeSchemas";
import type {
  UserListEntryResponse,
  UserListResponse,
} from "@/schemas/zod/listFormSchema";
import { Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

export interface EditableListDraft {
  title: string;
  description: string;
  entries: UserListEntryResponse[];
}

interface UserEntryShowcaseProps {
  list: UserListResponse;
  username?: string;
  isEditting?: boolean;
  draft?: EditableListDraft;
  handleChange: (field: "title" | "description", value: string) => void;
  onAddEntry?: () => void;
  onRemoveEntry?: (index: number) => void;
  onEntryDragStart?: (index: number) => void;
  onEntryDrop?: (targetIndex: number) => void;
  onEntryDragEnd?: () => void;
}

export default function UserEntryShowcase({
  list,
  username,
  isEditting,
  draft,
  handleChange,
  onAddEntry,
  onRemoveEntry,
  onEntryDragStart,
  onEntryDrop,
  onEntryDragEnd,
}: UserEntryShowcaseProps) {
  const displayUsername = username ?? list.owner_id;

  const editableEntries = draft?.entries ?? [];
  const readOnlyEntries = [...list.user_list_entry].sort((a, b) => {
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
  });

  const sourceEntries = isEditting ? editableEntries : readOnlyEntries;

  const entries = sourceEntries.map((entry, index) => {
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
            {isEditting ? (
              <input
                value={draft?.title ?? ""}
                onChange={(e) => {
                  handleChange("title", e.target.value);
                }}
                className="font-medium text-[20px] flex items-start text-[#9a9a9a] tracking-wide mt-0.5 uppercase bg-transparent border-b border-slate-700 focus:border-white focus:outline-none"
              />
            ) : (
              <Link
                to={`/list/${list.id}`}
                className="font-medium text-[20px] flex items-start text-[#9a9a9a] tracking-wide mt-0.5 uppercase hover:text-white transition-colors"
              >
                {list.title}
              </Link>
            )}
            <p className="absolute font-bold right-0 opacity-25">
              Entries {list.user_list_entry.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-[13px] overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {entries.map((entry, index) => {
          const cardContent = (
            <>
              <div className="absolute top-0 -right-5 -translate-x-1/12 w-[70px] h-[70px] rounded-full bg-[#101114] border-2 border-slate-700 flex items-center justify-center z-10">
                <span className="font-bold text-[36px] text-white leading-none">
                  {entry.rank}
                </span>
              </div>

              {isEditting && onRemoveEntry ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveEntry(index);
                  }}
                  className="absolute top-7 left-2 z-20 w-7 h-7 rounded-full bg-black/70 border border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label={`Remove ${entry.title}`}
                >
                  <X size={14} className="text-white" />
                </button>
              ) : null}

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
                    <p className="text-lg font-bold text-white">
                      {entry.title}
                    </p>
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
              </div>
            </>
          );

          if (isEditting) {
            return (
              <div
                key={entry.id}
                className="group relative pt-[25px] transition-transform duration-200 ease-out hover:scale-[1.01] shrink-0 w-[240px] cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={() => onEntryDragStart?.(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onEntryDrop?.(index)}
                onDragEnd={() => onEntryDragEnd?.()}
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={entry.id}
              to={`/anime/${entry.animeId}`}
              aria-label={`View ${entry.title}`}
              className="group relative pt-[25px] transition-transform duration-200 ease-out hover:scale-[1.01] shrink-0 w-[240px]"
            >
              {cardContent}
            </Link>
          );
        })}

        {isEditting && onAddEntry ? (
          <button
            type="button"
            onClick={onAddEntry}
            className="relative pt-[25px] shrink-0 w-[240px] group"
            aria-label="Add anime"
          >
            <div className="w-full h-[384px] rounded-[38px] bg-slate-900/50 flex items-center justify-center border border-slate-800 hover:border-slate-500 hover:bg-slate-800/50 transition-colors">
              <Plus
                size={48}
                className="text-slate-500 group-hover:text-slate-200 transition-colors"
              />
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}
