import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Info, Menu, Search, X } from "lucide-react";
import { SearchBar } from "./SearchBar";
import AniLoadedLogo from "../assets/images/Ani-Loaded Logo.svg";
import { useAuthContext } from "@/services/supabase/hooks/AuthProvider";
import { useDismiss } from "../hooks/useDismiss";

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

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

// panels that open under the bar on phone/tablet (only one at a time)
type Panel = "search" | "menu" | "info";

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
  const navRef = useRef<HTMLElement>(null);

  // remember which route a panel was opened on so it closes itself on navigation
  const [openPanel, setOpenPanel] = useState<{ panel: Panel; path: string } | null>(null);
  const panel = openPanel?.path === pathname ? openPanel.panel : null;

  const closePanel = useCallback(() => setOpenPanel(null), []);
  useDismiss(navRef, panel !== null, closePanel);

  const togglePanel = (next: Panel) =>
    setOpenPanel(panel === next ? null : { panel: next, path: pathname });

  const isActiveLink = (link: string) =>
    link === "/" ? pathname === "/" : pathname.startsWith(link);

  const isDiscussionsRoute = pathname.startsWith("/discussions");
  const username = user?.user_metadata?.username || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || DEFAULT_AVATAR;

  return (
    <nav
      ref={navRef}
      className="relative top-0 z-50 w-full border-b border-[#1B1F27] text-left text-white lg:border-b-0"
    >
      <div className="mx-auto flex h-14 w-full max-w-300 items-center justify-between px-4 sm:h-18 sm:px-5 lg:h-[2.875rem] lg:pt-5 xl:px-0">
        {/* Logo (+ recommendations sidebar toggle) */}
        <div className="flex items-center gap-3">
          {showRecommendationsMenuButton ? (
            <button
              type="button"
              onClick={onToggleRecommendationsSidebar}
              className="inline-flex size-8.5 items-center justify-center rounded-full border border-white/12 bg-white/4 text-slate-300 transition hover:border-[#3CB4FF]/40 hover:bg-[#3CB4FF]/12 hover:text-white sm:size-11"
              aria-label={
                isRecommendationsSidebarOpen
                  ? "Close recommendation chats"
                  : "Open recommendation chats"
              }
              aria-expanded={isRecommendationsSidebarOpen}
              aria-controls="recommendations-sidebar"
            >
              <Menu className="size-4.5 sm:size-5.5" />
            </button>
          ) : null}
          <Link to="/" className="size-12 shrink-0 sm:size-16 lg:size-25">
            <img src={AniLoadedLogo} alt="Site Logo" className="size-full" />
          </Link>
        </div>

        {/* Desktop: nav links + search */}
        <div className="hidden items-center lg:flex">
          <ol className="flex">
            {navbarLinks.map((item) => (
              <li key={item.id} className="px-3">
                <Link
                  to={item.link}
                  className={`navbar-text transition-colors duration-300 ${
                    isActiveLink(item.link) ? "text-[#3CB4FF]" : "hover:text-[#3CB4FF]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
          <SearchBar />
        </div>

        {/* Desktop: auth */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link to="/profile" className="group flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300 transition-colors group-hover:text-white">
                {username}
              </span>
              <img
                src={avatarUrl}
                alt="Avatar"
                className="size-8 rounded-full border-2 border-slate-600 object-cover transition-colors group-hover:border-[#3CB4FF]"
              />
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-4xl bg-[#0066a5] px-3.5 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Phone/tablet: round icon buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
          <IconButton
            label={panel === "search" ? "Close search" : "Search"}
            active={panel === "search"}
            onClick={() => togglePanel("search")}
          >
            {panel === "search" ? (
              <X className="size-3.75 sm:size-4.25" />
            ) : (
              <Search className="size-3.75 sm:size-4.25" />
            )}
          </IconButton>
          <IconButton
            label={panel === "menu" ? "Close menu" : "Open menu"}
            active={panel === "menu"}
            onClick={() => togglePanel("menu")}
          >
            {panel === "menu" ? (
              <X className="size-3.75 text-[#CAD5E2] sm:size-4.25" />
            ) : (
              <Menu className="size-3.75 text-[#CAD5E2] sm:size-4.5" />
            )}
          </IconButton>
          {isDiscussionsRoute && (
            <IconButton
              label="About discussions"
              active={panel === "info"}
              onClick={() => togglePanel("info")}
              className="ml-2 sm:size-8.5"
            >
              <Info strokeWidth={1.75} className="size-4" />
            </IconButton>
          )}
          {/* Tablet only: sign in / avatar sits in the bar */}
          {user ? (
            <Link to="/profile" aria-label="Profile" className="hidden shrink-0 sm:block">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="size-9.5 rounded-full border-2 border-slate-600 object-cover transition-colors hover:border-[#3CB4FF]"
              />
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="hidden h-9.5 items-center rounded-[19px] bg-[#0066A5] px-4 font-['Inter'] text-sm/5 font-semibold text-white transition-opacity hover:opacity-90 sm:flex"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Phone/tablet: search row */}
      {panel === "search" && (
        <div className="absolute inset-x-0 top-full border-b border-[#1B1F27] bg-[#101114] px-4 py-3 sm:px-5 lg:hidden">
          <SearchBar className="w-full" autoFocus />
        </div>
      )}

      {/* Phone/tablet: menu */}
      {panel === "menu" && (
        <DropdownPanel>
          <ol className="flex flex-col gap-0.5">
            {navbarLinks.map((item) => {
              const active = isActiveLink(item.link);
              return (
                <li key={item.id}>
                  <Link
                    to={item.link}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-10 items-center rounded-lg px-2.5 font-['Inter'] text-[13px]/4.75 font-bold transition-colors ${
                      active
                        ? "bg-[#1D293D] text-[#3CB4FF]"
                        : "text-[#E9ECF2] hover:bg-[#1B2029]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ol>
          {/* Phone only: auth lives in the menu */}
          <div className="mt-2 border-t border-[#2A3342] pt-2 sm:hidden">
            {user ? (
              <Link
                to="/profile"
                className="flex h-11 items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-[#1B2029]"
              >
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="size-7 rounded-full border-2 border-slate-600 object-cover"
                />
                <span className="font-geist text-sm font-semibold text-[#E9ECF2]">{username}</span>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="flex h-10 items-center justify-center rounded-[20px] bg-[#0066A5] font-['Inter'] text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Sign In
              </Link>
            )}
          </div>
        </DropdownPanel>
      )}

      {/* Phone/tablet on /discussions: about card (the desktop sidebar shows this instead) */}
      {panel === "info" && isDiscussionsRoute && (
        <DropdownPanel className="w-72 gap-3.5 p-4">
          <div className="font-geist text-base/5.5 font-semibold text-[#F3F5F9]">
            Discussions
          </div>
          <div className="font-geist text-sm/5.5 text-[#B4BCCB]">
            Share hot takes, react to seasonal news, or ask the community for
            recommendations.
          </div>
          <Link
            to="/discussion/submit"
            className="flex h-10 items-center justify-center rounded-[20px] bg-[#0066A5] font-['Inter'] text-[15px]/5 font-bold text-white transition-colors hover:bg-[#0A74B8]"
          >
            Create post
          </Link>
        </DropdownPanel>
      )}
    </nav>
  );
};

function IconButton({
  label,
  active,
  onClick,
  className = "",
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      onClick={onClick}
      className={`flex size-8.5 shrink-0 items-center justify-center rounded-full border bg-[#141922] text-[#8793A8] transition-colors hover:border-[#3A4557] hover:text-white sm:size-9.5 ${
        active ? "border-[#4DA3F0]/60 text-white" : "border-[#2A3342]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function DropdownPanel({
  className = "w-60 p-2",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute top-full right-4 mt-2 flex flex-col rounded-xl border border-[#2A3342] bg-[#171B22] shadow-[0_12px_32px_#00000073] sm:right-5 lg:hidden ${className}`}
    >
      {children}
    </div>
  );
}
