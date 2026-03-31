import LoadingSpinner from "@/components/LoadingSpinner";
import UserEntryShowcase from "@/components/UserEntryShowcase";
import { getSpecificList } from "@/services/api/userListsService";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function ListInfoPage() {
  // get param from the list in the route
  const { id } = useParams<{ id: string }>();

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
    <div className="px-6 py-10 space-y-10">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-row gap-5 justify-center">
          <div>{is_owner ? <button>Edit</button> : null}</div>
        </div>
        {/* <p className="text-sm text-slate-500"> */}
        {/*   {list.user_list_entry.length} entries */}
        {/* </p> */}
      </div>

      <div className="max-w-7xl mx-auto space-y-3">
        <UserEntryShowcase list={list} username={list.owner_username} />
        <p className="text-slate-300 text-base leading-relaxed">
          {list.description?.trim() || "No description provided."}
        </p>
      </div>
    </div>
  );
}
