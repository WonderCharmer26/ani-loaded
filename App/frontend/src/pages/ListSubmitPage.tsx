import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import type { AniListMedia } from "@/schemas/animeSchemas";
import ListAnimeCard from "@/components/forms/ListAnimeCard";
import ListAnimeSearchModal from "@/components/forms/ListAnimeSearchModal";
import ListTitleInput from "@/components/forms/ListTitleInput";
import { getAvailableGenres } from "@/services/api/animeCategoriesService";
import { postUserList } from "@/services/api/userListsService";
import {
  UserListRequest,
  UserListRequestSchema,
} from "@/schemas/zod/listFormSchema";
import { supabase } from "@/services/supabase/supabaseConnection";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// constants for sorting user anime entries
const MIN_ENTRIES_TO_SUBMIT = 5;
const MIN_ENTRIES_TO_DRAG = 2;

export default function ListSubmitPage() {
  const navigate = useNavigate();
  // states for validation
  const [entries, setEntries] = useState<AniListMedia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  // for description
  const MAX_WORDS = 250;

  function countWords(text: string) {
    return text.trim() === ""
      ? 0
      : text.trim().split(/\s+/).filter(Boolean).length;
  }

  const submitListMutation = useMutation({
    mutationFn: async ({
      payload,
      token,
    }: {
      payload: UserListRequest;
      token: string;
    }) => postUserList(payload, token),
    onSuccess: () => {
      toast.success("Your list has been created.");
      form.reset();
      setEntries([]);
      setModalOpen(false);
      navigate("/lists");
    },
  });

  // form defaultValues
  const defaultValues: UserListRequest = {
    title: "",
    genre: null,
    description: null,
    visibility: "public",
    amount: 0,
    entries: [],
  };

  const form = useForm({
    defaultValues,
    // validates the list to make sure it matches the schema
    validators: {
      onBlur: UserListRequestSchema,
    },
    onSubmit: async ({ value }: { value: UserListRequest }) => {
      // get the users session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error("Unable to validate your session. Please try again.");
        return;
      }

      const token = data.session?.access_token;

      if (!token) {
        toast.error("Please sign in to submit a list.");
        return;
      }

      const payload: UserListRequest = {
        ...value,
        amount: value.entries.length,
      };

      try {
        // send the post req
        await submitListMutation.mutateAsync({ payload, token });
      } catch (submissionError) {
        toast.error(`List submission failed: ${submissionError}`);
      }
    },
  });

  // fetch genres for the dropdown
  const { data: genres = [] } = useQuery<string[]>({
    queryKey: ["availableGenres"],
    queryFn: (): Promise<string[]> => getAvailableGenres(),
  });

  // functionality for the dropdown
  useEffect(() => {
    if (!isGenreOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(target)
      ) {
        setIsGenreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isGenreOpen]);

  const dragIndex = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const genreDropdownRef = useRef<HTMLDivElement | null>(null);

  function scrollToEnd() {
    setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }, 0);
  }

  function syncFormEntries(nextEntries: AniListMedia[]) {
    const mappedEntries = nextEntries.map((anime, index) => ({
      anime_id: anime.id,
      rank: index + 1,
    }));

    form.setFieldValue("entries", mappedEntries);
    form.setFieldValue("amount", mappedEntries.length);
  }

  const isDraggable = entries.length >= MIN_ENTRIES_TO_DRAG;

  const cardSlots = [...entries, undefined];
  const remaining = Math.max(0, MIN_ENTRIES_TO_SUBMIT - entries.length);

  //adding cards to the list
  function handleAdd(anime: AniListMedia) {
    setEntries((prev) => {
      const next = [...prev, anime];
      syncFormEntries(next);
      return next;
    });
    scrollToEnd();
  }

  // removing the cards from the list
  function handleRemove(index: number) {
    setEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      syncFormEntries(next);
      return next;
    });
  }

  // drag card func
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  // moving card func
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  // handle droping card func
  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;

    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      syncFormEntries(next);
      return next;
    });

    dragIndex.current = null;
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  function handleSubmit() {
    form.handleSubmit();
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (countWords(value) <= MAX_WORDS) {
      form.setFieldValue("description", value);
    }
  }

  return (
    <form.Subscribe
      selector={(state: { values: UserListRequest }) => state.values}
    >
      {(values: UserListRequest) => {
        const title = values.title;
        const descriptionText = values.description ?? "";
        const selectedGenre = values.genre ?? "";
        const visibility = values.visibility;
        const wordCount = countWords(descriptionText);
        const canSubmit =
          entries.length >= MIN_ENTRIES_TO_SUBMIT &&
          title.trim().length > 0 &&
          !submitListMutation.isPending;

        return (
          <div className="w-full min-h-screen px-6 py-10">
            {/* Header — title input + genre dropdown (structure preserved) */}
            <div className="flex flex-col items-start mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                Create List
              </p>
              <ListTitleInput
                value={title}
                onChange={(value: string) => form.setFieldValue("title", value)}
              />
              <div className="mt-4 flex items-center gap-2">
                {/* <span className="text-xs font-semibold uppercase tracking-widest text-slate-500"> */}
                {/*   Visibility */}
                {/* </span> */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("visibility", "public")}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition-colors ${
                      visibility === "public"
                        ? "bg-[#0066a5] text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue("visibility", "private")}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition-colors ${
                      visibility === "private"
                        ? "bg-[#0066a5] text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
              <div className="relative mt-3" ref={genreDropdownRef}>
                <button
                  onClick={() => setIsGenreOpen((prev) => !prev)}
                  className="rounded-lg px-4 py-2 text-md z-1 bg-black font-semibold focus-within:border-none transition-colors"
                >
                  {selectedGenre.toUpperCase() || `Select Genre ▼`}{" "}
                </button>
                {isGenreOpen && (
                  <div className="absolute top-full -mt-1.5 left-0 w-96 max-w-md rounded-lg bg-black p-4 shadow-lg z-50">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          form.setFieldValue("genre", null);
                          setIsGenreOpen(false);
                        }}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          selectedGenre === ""
                            ? "bg-[#0066a5] text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Clear
                      </button>
                      {genres.map((genre: string) => (
                        <button
                          key={genre}
                          onClick={() => {
                            form.setFieldValue("genre", genre);
                            setIsGenreOpen(false);
                          }}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            selectedGenre === genre
                              ? "bg-[#0066a5] text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-800 mb-8" />

            {/* Ranking section */}
            <section className="mb-14">
              {/* Section header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Your Ranking
                </h2>
                <div className="flex items-center gap-3">
                  {isDraggable && (
                    <span className="text-xs text-slate-500">
                      Drag to reorder
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                      canSubmit
                        ? "bg-[#3CB4FF]/10 text-[#3CB4FF]"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {entries.length} / {MIN_ENTRIES_TO_SUBMIT}
                  </span>
                </div>
              </div>

              {/* Cards carousel — always shows exactly 5 at a time */}
              <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
                <div
                  className="grid gap-[13px] w-full"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(5, cardSlots.length)}, calc(20% - 10.4px))`,
                  }}
                >
                  {cardSlots.map((anime, i) => {
                    const isEmptySlot = anime === undefined;
                    return (
                      <div key={isEmptySlot ? "empty-slot" : anime!.id}>
                        <ListAnimeCard
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation hint inline under cards */}
              {entries.length < MIN_ENTRIES_TO_SUBMIT && (
                <p className="mt-4 text-sm text-slate-500">
                  {entries.length === 0
                    ? `Add at least ${MIN_ENTRIES_TO_SUBMIT} anime to submit your list.`
                    : `${remaining} more ${remaining === 1 ? "entry" : "entries"} needed to submit.`}
                </p>
              )}
            </section>

            {/* Description + Submit */}
            <div className="w-full flex flex-col items-center ">
              {/* Description */}
              <div className="flex flex-col w-3xl mb-8">
                <label
                  htmlFor="list-description"
                  className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3"
                >
                  Description{" "}
                  <span className="font-normal normal-case tracking-normal text-slate-500">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="list-description"
                  value={descriptionText}
                  onChange={handleDescriptionChange}
                  placeholder="Tell people why you made this list..."
                  rows={5}
                  className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 px-5 py-4 text-white placeholder-slate-600 focus:border-slate-600 focus:outline-none resize-none transition-colors"
                />
                <p
                  className={`mt-2 text-xs text-right ${
                    wordCount >= MAX_WORDS ? "text-red-400" : "text-slate-600"
                  }`}
                >
                  {wordCount} / {MAX_WORDS} words
                </p>
              </div>

              {/* Submit row */}
              <div className="flex items-center flex-col gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`py-3 px-12 rounded-3xl font-bold text-white transition-all ${
                    canSubmit
                      ? "bg-[#0066a5] hover:bg-[#0077c0] cursor-pointer"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {submitListMutation.isPending
                    ? "Submitting..."
                    : "Submit List"}
                </button>
                {!canSubmit &&
                  title.trim().length === 0 &&
                  entries.length >= MIN_ENTRIES_TO_SUBMIT && (
                    <p className="text-sm text-slate-500">
                      Add a title to continue.
                    </p>
                  )}
              </div>
            </div>

            {/* Anime search modal */}
            <ListAnimeSearchModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onAdd={handleAdd}
              excludedIds={entries.map((e) => e.id)}
            />
          </div>
        );
      }}
    </form.Subscribe>
  );
}
