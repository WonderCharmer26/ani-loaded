import { useRef, useState } from "react";
import type { AniListMedia } from "@/schemas/animeSchemas";
import ListAnimeCard from "@/components/forms/ListAnimeCard";
import ListAnimeSearchModal from "@/components/forms/ListAnimeSearchModal";
import ListTitleInput from "@/components/forms/ListTitleInput";

const MIN_ENTRIES_TO_SUBMIT = 5;
const MIN_ENTRIES_TO_DRAG = 2;

export default function ListSubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<AniListMedia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const MAX_WORDS = 250;

  function countWords(text: string) {
    return text.trim() === ""
      ? 0
      : text.trim().split(/\s+/).filter(Boolean).length;
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (countWords(value) <= MAX_WORDS) {
      setDescription(value);
    }
  }

  const wordCount = countWords(description);

  // Track which index is being dragged
  const dragIndex = useRef<number | null>(null);

  // Ref for the scrollable cards container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  function scrollToEnd() {
    setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }, 0);
  }

  const isDraggable = entries.length >= MIN_ENTRIES_TO_DRAG;
  const canSubmit =
    entries.length >= MIN_ENTRIES_TO_SUBMIT && title.trim().length > 0;

  // The card slots to render: all filled entries + one empty "+" card
  const cardSlots = [...entries, undefined];

  function handleAdd(anime: AniListMedia) {
    setEntries((prev) => [...prev, anime]);
    scrollToEnd();
  }

  function handleRemove(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Drag-and-drop handlers ---
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // required to allow drop
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;

    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    dragIndex.current = null;
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  function handleSubmit() {
    if (!canSubmit) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      entries: entries.map((anime, i) => ({
        anime_id: anime.id,
        rank: i + 1,
      })),
    };

    console.log("List submit payload:", payload);
  }

  return (
    <div className="w-full px-6 py-10">
      {/* Header */}
      <div className="flex items-start mb-6">
        <ListTitleInput value={title} onChange={setTitle} />
      </div>

      {/* Cards row — scrollable only after 5 filled cards */}
      <div
        ref={scrollContainerRef}
        className={`flex gap-[13px] pb-2 ${
          entries.length >= MIN_ENTRIES_TO_SUBMIT
            ? "overflow-x-auto"
            : "overflow-x-hidden"
        }`}
      >
        {cardSlots.map((anime, i) => {
          const isEmptySlot = anime === undefined;

          return (
            <ListAnimeCard
              key={isEmptySlot ? "empty-slot" : anime!.id}
              anime={anime}
              rank={i + 1}
              isDraggable={!isEmptySlot && isDraggable}
              onAdd={() => setModalOpen(true)}
              onRemove={() => handleRemove(i)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                handleDragStart(i);
              }}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>

      {/* Description */}
      <div className="flex justify-center ">
        {" "}
        <div className="flex flex-col mt-8 w-4xl max-w-5xl">
          <label
            htmlFor="list-description"
            className="block text-sm font-semibold text-slate-400 mb-2"
          >
            Description{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          {/* description */}
          <textarea
            id="list-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Tell people why you made this list..."
            rows={4}
            className="w-full rounded-2xl bg-black px-4 py-3 text-white placeholder-gray-500 focus:border-slate-500 focus:outline-none resize-none"
          />
          <p
            className={`mt-1 text-xs text-right ${
              wordCount >= MAX_WORDS ? "text-red-400" : "text-slate-500"
            }`}
          >
            {wordCount} / {MAX_WORDS} words
          </p>
        </div>
      </div>

      {/* Validation hint */}
      {entries.length < MIN_ENTRIES_TO_SUBMIT && (
        <p className="mt-6 text-sm text-slate-500">
          Add at least {MIN_ENTRIES_TO_SUBMIT} anime to submit your list.{" "}
          {entries.length > 0 &&
            `(${MIN_ENTRIES_TO_SUBMIT - entries.length} more needed)`}
        </p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-8 py-3 px-10 rounded-3xl font-bold text-white transition-colors ${
          canSubmit
            ? "bg-black hover:bg-slate-800 cursor-pointer"
            : "bg-slate-700 opacity-50 cursor-not-allowed"
        }`}
      >
        Submit List
      </button>

      {/* Anime search modal */}
      <ListAnimeSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        excludedIds={entries.map((e) => e.id)}
      />
    </div>
  );
}
