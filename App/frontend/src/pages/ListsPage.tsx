// import { useQuery } from "@tanstack/react-query";
import TopAnimeListShowcase from "../components/TopAnimeShowcase";
// import { getAllLists } from "@/services/api/userListsService";

// get the users current auth state (replace)
// const DEMO_USER_ID = "demo-user";

// get the anime genres from backend will user for the UI

export default function ListsPage() {
  // different users lists

  // const { data: lists = [], isLoading } = useQuery<UserListResponse[]>({
  //   queryKey: ["userTopLists", DEMO_USER_ID],
  //   queryFn: () => getUsersTopLists(DEMO_USER_ID),
  //   // only fire if the users is signed in
  // });

  // get all the lists
  // const { data: listData = [], isLoading } = useQuery({
  //   queryKey: ["lists"],
  //   queryFn: () => getAllLists(),
  // });

  return (
    <div className="px-6 py-10 space-y-10">
      <TopAnimeListShowcase username="AnimeWatcher63" />
    </div>
  );
}
