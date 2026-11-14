// this file sets up the query client that will be used throughout the app
import { QueryClient } from "@tanstack/react-query";

// Create a client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // TODO: Might make the stale time longer so it's not a constant refresh needing to happen on most pages
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1, // TODO: might change the retry amount as well but 1, should be good for now
      // might add some more opts
    },
  },
});
