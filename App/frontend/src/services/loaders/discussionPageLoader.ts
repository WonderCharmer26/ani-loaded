import type { QueryClient } from "@tanstack/react-query";
import { getAllDiscussions } from "../api/discussionService";

// preloader to help with discussion page data fetching
export function discussionPageLoader(queryClient: QueryClient) {
  return async () => {
    try {
      await queryClient.ensureQueryData({
        queryKey: ["discussions", {}],
        queryFn: () => getAllDiscussions(),
      });
    } catch {
      // Keep route navigation working even if prefetch fails.
    }
    return null;
  };
}
