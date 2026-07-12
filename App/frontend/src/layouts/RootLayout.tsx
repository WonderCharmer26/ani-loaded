// main layout for the base of the application
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";

export interface RootLayoutOutletContext {
  isRecommendationsSidebarOpen: boolean;
  closeRecommendationsSidebar: () => void;
}

export default function RootLayout() {
  const { pathname } = useLocation();
  const [isRecommendationsSidebarOpen, setIsRecommendationsSidebarOpen] =
    useState(false);
  const isRecommendationsRoute = pathname.startsWith("/recommendations");

  useEffect(() => {
    if (!isRecommendationsRoute && isRecommendationsSidebarOpen) {
      setIsRecommendationsSidebarOpen(false);
    }
  }, [isRecommendationsRoute, isRecommendationsSidebarOpen]);

  const closeRecommendationsSidebar = () => {
    setIsRecommendationsSidebarOpen(false);
  };

  const toggleRecommendationsSidebar = () => {
    setIsRecommendationsSidebarOpen((current) => !current);
  };

  return (
    <div className="app relative">
      <header className="app-header">
        <Navbar
          showRecommendationsMenuButton={isRecommendationsRoute}
          isRecommendationsSidebarOpen={isRecommendationsSidebarOpen}
          onToggleRecommendationsSidebar={toggleRecommendationsSidebar}
        />
      </header>
      <main className="mt-[72px] ">
        <Outlet
          context={{
            isRecommendationsSidebarOpen,
            closeRecommendationsSidebar,
          }}
        />
      </main>
      {/* TODO: add something here to separate the footer from the rest of the content */}
      <Footer />
    </div>
  );
}
