// import { useQuery } from "@tanstack/react-query";
import CreateButton from "@/components/CreateButton";
import TopAnimeListShowcase from "../components/TopAnimeShowcase";
import LinkButton from "@/components/CreateButton";
import { useQuery } from "@tanstack/react-query";
import { getAllLists } from "@/services/api/userListsService";

//  TODO: Add in a filtering dropdown to get the different list types from the backend

export default function ListsPage() {
  // TODO: Add in the fetching function to get lists from the backend
  const { data, error } = useQuery({
    queryKey: ["lists"],
    queryFn: () => getAllLists(),
  });

  return (
    <div className="px-6 py-10 space-y-10">
      {/* top of list page */}
      <div className="w-full flex justify-end">
        <LinkButton word="Create" link="/list/create" />
      </div>
      <TopAnimeListShowcase username="AnimeWatcher63" />
    </div>
  );
}
