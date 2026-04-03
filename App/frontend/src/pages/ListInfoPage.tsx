import LoadingSpinner from "@/components/LoadingSpinner";
import UserEntryShowcase from "@/components/UserEntryShowcase";
import ListAnimeSearchModal from "@/components/forms/ListAnimeSearchModal";
import type { AniListMedia } from "@/schemas/animeSchemas";
import {
  UserListUpdateRequest,
  UserListUpdateSchema,
  type UserListEntryResponse,
} from "@/schemas/zod/listFormSchema";
import { getSpecificList, updateList } from "@/services/api/userListsService";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

type ListInfoFormValues = {
  title: string;
  description: string;
  entries: UserListEntryResponse[];
};

type EntryUpdatePayload = UserListUpdateRequest["entries"][number];

type OriginalListSnapshot = {
  title: string;
  description: string;
  entries: EntryUpdatePayload[];
};

export default function ListInfoPage() {
  // get param from the list in the route
  const { id } = useParams<{ id: string }>();

  // queryKey for refreshing data
  const queryClient = useQueryClient();

  // get the specific list data
  const {
    data: list,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["list", id],
    queryFn: () => getSpecificList(id!),
    enabled: !!id,
  });

  // states for editting specific and saving fields that user wants to change
  const [isEditting, setIsEditting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const originalSnapshotRef = useRef<OriginalListSnapshot>({
    title: "",
    description: "",
    entries: [],
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      entries: [],
    } as ListInfoFormValues,
    onSubmit: async ({ value }: { value: ListInfoFormValues }) => {
      if (!id) return;

      const normalizedEntries = normalizeRanks(value.entries).map((entry) => ({
        anime_id: entry.anime_id,
        rank: entry.rank,
      }));

      const currentTitle = value.title;
      const currentDescription = value.description;

      const listData: UserListUpdateRequest["list_data"] = {};

      if (currentTitle !== originalSnapshotRef.current.title) {
        listData.title = currentTitle;
      }

      if (currentDescription !== originalSnapshotRef.current.description) {
        listData.description = currentDescription;
      }

      const didEntriesChange =
        normalizedEntries.length !== originalSnapshotRef.current.entries.length ||
        normalizedEntries.some((entry, index) => {
          const originalEntry = originalSnapshotRef.current.entries[index];
          if (!originalEntry) return true;

          return (
            entry.anime_id !== originalEntry.anime_id ||
            entry.rank !== originalEntry.rank
          );
        });

      if (!didEntriesChange && Object.keys(listData).length === 0) {
        toast.info("No changes to save");
        setIsEditting(false);
        return;
      }

      const payload: UserListUpdateRequest = {
        list_data: listData,
        entries: normalizedEntries,
      };

      const validatedPayload = UserListUpdateSchema.parse(payload);
      await mutation.mutateAsync(validatedPayload);
      setIsEditting(false);
    },
  });

  // mutation for updating owners list
  const mutation = useMutation({
    mutationFn: (payload: UserListUpdateRequest) => updateList(id, payload),
    mutationKey: ["list", id],
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["list", id] });
    },
  });

  // func for changing list
  useEffect(() => {
    if (!list || isEditting) return;

    const normalizedEntries = normalizeRanks(list.user_list_entry);

    form.setFieldValue("title", list.title);
    form.setFieldValue("description", list.description ?? "");
    form.setFieldValue("entries", normalizedEntries);

    originalSnapshotRef.current = {
      title: list.title,
      description: list.description ?? "",
      entries: normalizedEntries.map((entry) => ({
        anime_id: entry.anime_id,
        rank: entry.rank,
      })),
    };
  }, [isEditting, list]);

  // make sure that the rank numbered properly
  const normalizeRanks = (
    entries: UserListEntryResponse[],
  ): UserListEntryResponse[] => {
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  };

  // function for updating form change
  const handleChange = (field: "title" | "description", value: string) => {
    form.setFieldValue(field, value);
  };

  const handleEntryRemove = (index: number) => {
    const currentEntries = form.state.values.entries;
    const next = currentEntries.filter((_, i) => i !== index);
    form.setFieldValue("entries", normalizeRanks(next));
  };

  const handleEntryAdd = (anime: AniListMedia) => {
    const currentEntries = form.state.values.entries;
    const next: UserListEntryResponse[] = [
      ...currentEntries,
      {
        id: `draft-${anime.id}-${Date.now()}`,
        anime_id: anime.id,
        rank: currentEntries.length + 1,
        anime,
      },
    ];

    form.setFieldValue("entries", normalizeRanks(next));
  };

  const handleEntryDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleEntryDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    if (from == null || from === targetIndex) {
      dragIndex.current = null;
      return;
    }

    const currentEntries = [...form.state.values.entries];
    const [moved] = currentEntries.splice(from, 1);

    if (!moved) {
      dragIndex.current = null;
      return;
    }

    currentEntries.splice(targetIndex, 0, moved);
    form.setFieldValue("entries", normalizeRanks(currentEntries));

    dragIndex.current = null;
  };

  const handleEntryDragEnd = () => {
    dragIndex.current = null;
  };

  const handleEditToggle = async () => {
    if (!isEditting) {
      setIsEditting(true);
      return;
    }

    await form.handleSubmit();
  };

  // store checker for owner validatation
  const is_owner = list?.is_owner;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-red-400">Failed to load this list.</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-white">List not found.</p>
      </div>
    );
  }

  return (
    <form.Subscribe selector={(state: { values: ListInfoFormValues }) => state.values}>
      {(values: ListInfoFormValues) => (
        <div className="px-6 py-10 space-y-10">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-row gap-5 justify-center">
              <div>
                {is_owner ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleEditToggle();
                    }}
                    disabled={mutation.isPending}
                    className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    {mutation.isPending
                      ? "Saving..."
                      : isEditting
                        ? "Done"
                        : "Edit"}
                  </button>
                ) : null}
              </div>
            </div>
            {/* <p className="text-sm text-slate-500"> */}
            {/*   {list.user_list_entry.length} entries */}
            {/* </p> */}
          </div>

          <div className="max-w-7xl mx-auto space-y-3">
            <UserEntryShowcase
              isEditting={isEditting}
              list={list}
              username={list.owner_username}
              draft={values}
              handleChange={handleChange}
              // functionality for moving and updating the list
              onAddEntry={() => setIsModalOpen(true)}
              onRemoveEntry={handleEntryRemove}
              onEntryDragStart={handleEntryDragStart}
              onEntryDrop={handleEntryDrop}
              onEntryDragEnd={handleEntryDragEnd}
            />
            {isEditting ? (
              <textarea
                value={values.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={5}
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 px-5 py-4 text-white placeholder-slate-600 focus:border-slate-600 focus:outline-none resize-none transition-colors"
              />
            ) : (
              <p className="text-slate-300 text-base leading-relaxed">
                {list.description?.trim() || "No description provided."}
              </p>
            )}

            <ListAnimeSearchModal
              isOpen={isModalOpen && isEditting}
              onClose={() => setIsModalOpen(false)}
              onAdd={handleEntryAdd}
              excludedIds={values.entries.map((entry) => entry.anime_id)}
            />
          </div>
        </div>
      )}
    </form.Subscribe>
  );
}
