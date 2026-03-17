import { Plus, X } from "lucide-react";
import type { AniListMedia } from "@/schemas/animeSchemas";
import { getDisplayTitle } from "@/schemas/animeSchemas";

interface FilledCardProps {
  anime: AniListMedia;
  rank: number;
  isDraggable: boolean;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

interface EmptyCardProps {
  onAdd: () => void;
}

// A filled card — mirrors the TopAnimeShowcase card style
function FilledListCard({
  anime,
  rank,
  isDraggable,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: FilledCardProps) {
  const title = getDisplayTitle(anime.title) || `Anime #${anime.id}`;
  const coverSrc = anime.coverImage?.large ?? anime.coverImage?.medium ?? "";

  return (
    <div
      className={`relative w-[250px] flex-shrink-0 pt-[25px] group ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? onDrop : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {/* Rank badge — matches TopAnimeShowcase exactly */}
      <div className="absolute top-0 -right-5 -translate-x-1/12 w-[70px] h-[70px] rounded-full bg-[#101114] border-2 border-slate-700 flex items-center justify-center z-10">
        <span className="font-bold text-[36px] text-white leading-none">
          {rank}
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-7 left-2 z-20 w-7 h-7 rounded-full bg-black/70 border border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        aria-label={`Remove ${title}`}
      >
        <X size={14} className="text-white" />
      </button>

      {/* Cover image */}
      {coverSrc ? (
        <img
          src={coverSrc}
          alt={title}
          className="w-full h-[384px] object-cover rounded-[38px]"
        />
      ) : (
        <div className="w-full h-[384px] rounded-[38px] bg-slate-800 flex items-center justify-center">
          <span className="text-slate-500 text-sm text-center px-2">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

// An empty placeholder card with a "+" button
function EmptyListCard({ onAdd }: EmptyCardProps) {
  return (
    <div className="relative w-[240px] flex-shrink-0 pt-[25px]">
      <button
        type="button"
        onClick={onAdd}
        className="w-full h-[384px] rounded-[38px] bg-slate-900/50 flex items-center justify-center hover:border-slate-400 hover:bg-slate-800/50 transition-colors group"
        aria-label="Add anime"
      >
        <Plus
          size={48}
          className="text-slate-500 group-hover:text-slate-300 transition-colors"
        />
      </button>
    </div>
  );
}

// Exported union card — renders filled or empty depending on whether anime is provided
interface ListAnimeCardProps {
  anime?: AniListMedia;
  rank: number;
  isDraggable: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export default function ListAnimeCard({
  anime,
  rank,
  isDraggable,
  onAdd,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ListAnimeCardProps) {
  if (anime) {
    return (
      <FilledListCard
        anime={anime}
        rank={rank}
        isDraggable={isDraggable}
        onRemove={onRemove}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />
    );
  }

  return <EmptyListCard onAdd={onAdd} />;
}
