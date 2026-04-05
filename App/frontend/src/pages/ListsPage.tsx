import UserEntryShowcase from "../components/UserEntryShowcase";
import LinkButton from "@/components/CreateButton";
import { useQuery } from "@tanstack/react-query";
import { getAllLists } from "@/services/api/userListsService";

//  TODO: Add in a filtering dropdown to get the different list types from the backend
// TODO: add lists hover that shows anime genre
// TODO: Make sure that the list posting function works again
// TODO: Work on wiring up UserListResponseWrapper
// TODO: Work on fk relation with profile and userlist

export default function ListsPage() {
  // get all lists
  const { data, error, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: () => getAllLists(),
  });

  return (
    <div className="px-6 py-10 space-y-10">
      {/* top of list page */}
      {/* TODO: ADD A TITLE FOR THE LIST PAGE */}
      <div className="w-full flex justify-end">
        <LinkButton word="Create" link="/list/create" />
      </div>

      {isLoading && <p className="text-slate-300">Loading lists...</p>}

      {error && !isLoading && (
        <p className="text-red-400">Failed to load public lists.</p>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <p className="text-slate-300">No public lists available yet.</p>
      )}

      {!isLoading &&
        !error &&
        data?.map((list) => (
          <UserEntryShowcase
            key={list.id}
            list={list}
            username={list.owner_username}
          />
        ))}
    </div>
  );
}
