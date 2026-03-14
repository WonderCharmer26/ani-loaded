// import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import "./index.css";

// Import pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import UserProfilePage from "./pages/UserProfilePage";
import AnimeInfoPage from "./pages/AnimeInfoPage";
import DiscussionPage from "./pages/DiscussionPage";
import ListsPage from "./pages/ListsPage";
import AnimeCategoriesPage from "./pages/AnimeCategoriesPage";
import RecommendationsPage from "./pages/RecommendationsPage";

// Layout Components
import AuthLayout from "./layouts/AuthLayout";
import RootLayout from "./layouts/RootLayout";
import { homePageFetcher } from "./services/loaders/homePageLoader";
// import { Feather } from "lucide-react";
import { animeInfoPrefetcher } from "./services/loaders/animeInfoPrefetcher";
import { queryClient } from "./services/clients/queryClient";
import { discussionPageLoader } from "./services/loaders/discussionPageLoader";
import { listsPageLoader } from "./services/loaders/listsPageLoader";
import { animeCategoriesLoader } from "./services/loaders/animeCategoriesLoader";
import { recommendationsPageLoader } from "./services/loaders/recommendationsPageLoader";
import DiscussionInfoPage from "./pages/DiscussionInfoPage";
import { discussionInfoPrefetcher } from "./services/loaders/discussionInfoPrefetcher";
import ErrorBoundary from "./components/ErrorBoundary";
import DiscussionSubmitPage from "./pages/DiscussionSubmitPage";
import { AuthProvider } from "./services/supabase/hooks/AuthProvider";
import { Toaster } from "sonner";

// Fetching functions to get data for the HomePage
const demoUserId = "demo-user"; // TODO: plug in real user data, supabase useAuth might handle this for me
// NOTE: might use supabase.auth.getUser to help with getting data for protected routes
//
// Create router configuration with layouts
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        // Main Page
        index: true,
        element: <HomePage />,
        // NOTE: homePageFetcher get the raw calrousel data and also returns the anime queries for the showcase sections on the page
        loader: homePageFetcher(queryClient),
      },
      {
        // Discussion Page
        // TODO: Replace with the actual data fetching functions
        path: "discussions",
        element: <DiscussionPage />,
        loader: discussionPageLoader(queryClient),
      },
      {
        // Individual Discussion Info Page
        path: "discussion/:id",
        element: <DiscussionInfoPage />,
        loader: discussionInfoPrefetcher(queryClient),
        errorElement: <ErrorBoundary />,
      },
      {
        path: "discussion/submit",
        element: <DiscussionSubmitPage />,
        // add in loader
        // might add in error
      },
      {
        // Lists Page
        // TODO: Replace with the actual data fetching functions
        path: "lists",
        element: <ListsPage />,
        loader: listsPageLoader(queryClient, demoUserId),
      },
      {
        // Anime Page: Shows all the different Anime to choose from
        // TODO: Replace with the actual data fetching functions
        path: "anime",
        element: <AnimeCategoriesPage />,
        loader: animeCategoriesLoader(queryClient),
      },
      {
        // Recommendation Page: Shows anime suggestion to the user for them to help pick an anime to watch
        // TODO: Replace with the actual data fetching functions
        path: "recommendations",
        element: <RecommendationsPage />,
        loader: recommendationsPageLoader(queryClient, demoUserId),
      },
      {
        // Profile page
        path: "profile",
        element: <UserProfilePage />,
      },
      // NOTE: might make anime layout for all the anime pages
      {
        // info about the anime (might route into it's parent route)
        path: "anime/:id",
        element: <AnimeInfoPage />,
        // loader to help with prefetching for the anime info page before it loads
        // NOTE: cache is stored in tanstack query's cache
        loader: animeInfoPrefetcher(queryClient), // all the needed parts for this page are prefetched

        // TODO: add in a loader function to preload the information for the anime page
      },
    ],
  },

  {
    // NOTE: route auth/login and auth/signup
    path: "auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
    ],
  },
]);

function App() {
  // Wrap the router once so every route can read auth state.
  return (
    <AuthProvider>
      <Toaster />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
