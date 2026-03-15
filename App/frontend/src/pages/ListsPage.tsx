import { useQuery } from "@tanstack/react-query";
import type { UserAnimeList } from "../schemas/userLists";
import { getUserTopLists } from "../services/api/userListsService";
import TopAnimeListShowcase from "../components/TopAnimeShowcase";

const DEMO_USER_ID = "demo-user";

export default function ListsPage() {
  const { data: lists = [], isLoading } = useQuery<UserAnimeList[]>({
    queryKey: ["userTopLists", DEMO_USER_ID],
    queryFn: () => getUserTopLists(DEMO_USER_ID),
  });

  return (
    <div className="px-6 py-10 space-y-10">
      <TopAnimeListShowcase username="AnimeWatcher63" />
    </div>
  );
}
