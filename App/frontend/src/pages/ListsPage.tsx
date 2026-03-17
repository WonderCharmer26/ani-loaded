// import { useQuery } from "@tanstack/react-query";
import CreateButton from "@/components/CreateButton";
import TopAnimeListShowcase from "../components/TopAnimeShowcase";
import LinkButton from "@/components/CreateButton";

export default function ListsPage() {
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
