import type { QueryClient } from "@tanstack/react-query";
import { getUsersTopLists } from "../api/userListsService";

export function listsPageLoader(queryClient: QueryClient, userToken: string) {
  return async () => {
    await queryClient.ensureQueryData({
      queryKey: ["userTopLists", userToken],
      queryFn: () => getUsersTopLists(userToken),
    });
    return null;
  };
}
