import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Menu } from "lucide-react";
import AniLoadedLogo from "../assets/images/Ani-Loaded Logo.svg";
import { useAuthContext } from "@/services/supabase/hooks/AuthProvider";

interface NavbarLink {
  id: number;
  label: string;
  link: string;
}

const navbarLinks: NavbarLink[] = [
  { id: 1, label: "HOME", link: "/" },
  { id: 2, label: "DISCUSSIONS", link: "/discussions" },
  { id: 3, label: "LISTS", link: "/lists" },
  { id: 4, label: "ANIME", link: "/anime" },
  { id: 5, label: "RECOMMENDATION", link: "/recommendations" },
];

interface NavbarProps {
  showRecommendationsMenuButton?: boolean;
  isRecommendationsSidebarOpen?: boolean;
  onToggleRecommendationsSidebar?: () => void;
}

export const Navbar = ({
  showRecommendationsMenuButton = false,
  isRecommendationsSidebarOpen = false,
  onToggleRecommendationsSidebar,
}: NavbarProps) => {
  const { user } = useAuthContext();
  const { pathname } = useLocation();

  return (
    <nav className="flex relative pt-5 z-50 top-0 w-full h-[2.875rem] items-center justify-between text-white">
      {/* Logo */}
      <div className="flex items-center gap-3">
        {showRecommendationsMenuButton ? (
          <button
            type="button"
            onClick={onToggleRecommendationsSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/4 text-slate-300 transition hover:border-[#3CB4FF]/40 hover:bg-[#3CB4FF]/12 hover:text-white"
            aria-label={
              isRecommendationsSidebarOpen
                ? "Close recommendation chats"
                : "Open recommendation chats"
            }
            aria-expanded={isRecommendationsSidebarOpen}
            aria-controls="recommendations-sidebar"
          >
            <Menu size={22} />
          </button>
        ) : null}
        <Link to="/" className="h-25 w-25 shrink-0">
          <img src={AniLoadedLogo} alt="Site Logo" />
        </Link>
      </div>

      {/* Nav links + search */}
      <div className="flex items-center">
        <ol className="flex">
          {navbarLinks.map((item) => {
            const isActive =
              item.link === "/"
                ? pathname === "/"
                : pathname.startsWith(item.link);

            return (
              <li key={item.id} className="px-3">
                <Link to={item.link}>
                  <p
                    className={`navbar-text transition-colors duration-300 ${
                      isActive
                        ? "text-[#3CB4FF]"
                        : "hover:text-[#3CB4FF]"
                    }`}
                  >
                    {item.label}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
        <SearchBar />
      </div>

      {/* Auth section */}
      <div className="flex items-center gap-3">
        {user ? (
          <Link to="/profile" className="flex items-center gap-2 group">
            <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
              {user.user_metadata?.username || "User"}
            </span>
            <img
              src={
                user.user_metadata?.avatar_url ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-600 group-hover:border-[#3CB4FF] transition-colors"
            />
          </Link>
        ) : (
          <>
            <Link
              to="/auth/login"
              className="bg-[#0066a5] font-semibold text-white px-3.5 py-1.5 rounded-4xl hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
