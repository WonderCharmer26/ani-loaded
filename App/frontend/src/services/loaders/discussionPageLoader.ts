import type { QueryClient } from "@tanstack/react-query";
import { getAllDiscussions } from "../api/discussionService";

// preloader to help with discussion page data fetching
export function discussionPageLoader(queryClient: QueryClient) {
  return async () => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ["discussions"],
        queryFn: getAllDiscussions,
      }),
      // queryClient.ensureQueryData({
      //   queryKey: ["discussionTopics"],
      //   queryFn: getTrendingTopics,
      // }),
    ]);
    return null;
  };
}
