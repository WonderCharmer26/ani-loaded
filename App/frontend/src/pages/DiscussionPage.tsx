import { useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import type { Discussion, DiscussionsCategories } from "../schemas/discussion";
import type { DiscussionQueryParams } from "../services/api/discussionService";
import {
  getAllDiscussions,
  getDiscussionCategories,
} from "../services/api/discussionService";
import DiscussionCard from "../components/DiscussionCard";
import CategoryFilterMenu from "../components/CategoryFilterMenu";

// NOTE: refresh triggered on DiscussionSubmitPage

type SortValue = NonNullable<DiscussionQueryParams["sort"]>;

const SORT_TABS: { label: string; value: SortValue }[] = [
  { label: "New", value: "newest" },
  { label: "Top", value: "most_upvoted" },
  { label: "Hot", value: "most_commented" },
  { label: "Old", value: "oldest" },
];

const COMMUNITY_RULES = [
  "Be kind, argue about anime and not people.",
  "Tag spoilers and keep them out of titles.",
  "No piracy links or reposted content.",
];

const SUBMIT_LINK = "/discussion/submit";

export default function DiscussionPage() {
  // search comes from the url (?search=) so the navbar search can drive it
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");

  // build query params
  const queryParams: DiscussionQueryParams = {
    ...(search && { search }),
    ...(categoryId && { category_id: categoryId }),
    sort,
  };

  // fetch discussions with filters
  const {
    data: threads = [],
    isLoading: threadsLoading,
    isError,
    error,
  } = useQuery<Discussion[]>({
    queryKey: ["discussions", queryParams],
    queryFn: () => getAllDiscussions(queryParams),
  });

  // fetch categories for the filters
  const { data: categories = [] } = useQuery<DiscussionsCategories[]>({
    queryKey: ["discussionCategories"],
    queryFn: getDiscussionCategories,
  });

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    setSearchParams(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-300 items-start gap-16 px-4 text-left pt-4 pb-12 antialiased sm:px-5 sm:pt-5 lg:pt-7 xl:px-0 lg:pb-18">
      {/* Feed */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5 lg:max-w-200 lg:gap-0">
        {/* Composer */}
        <Link
          to={SUBMIT_LINK}
          className="flex h-12 shrink-0 items-center gap-2 rounded-3xl border border-[#232832] bg-[#13161C] px-2.5 transition-colors hover:border-[#314158] sm:h-13 sm:gap-3 sm:rounded-[26px] sm:px-2.75 lg:mb-5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-[#26303F] font-geist text-[11px]/3.75 font-semibold text-[#B9C4D6] sm:size-7.5 sm:rounded-[15px] sm:text-xs/4">
            You
          </span>
          <span className="grow truncate font-geist text-sm/5 text-[#8B94A5] sm:text-[15px]/5.5">
            Start a discussion
          </span>
          <span className="flex h-7 shrink-0 items-center rounded-[14px] bg-[#0066A5] px-3 font-['Inter'] text-xs/4.25 font-bold text-white sm:h-7.5 sm:rounded-[15px] sm:px-3.5 sm:text-[13px]/4.5">
            <span className="sm:hidden">Post</span>
            <span className="hidden sm:inline">New post</span>
          </span>
        </Link>

        {/* Sort tabs + category filter */}
        <div className="flex h-10 shrink-0 items-center gap-1.5 sm:h-11 sm:gap-1">
          <div
            role="group"
            aria-label="Sort discussions"
            className="flex h-10 shrink-0 items-center gap-1 rounded-[20px] border border-[#232832] bg-[#151A24] p-1 sm:h-11 sm:rounded-[22px]"
          >
            {SORT_TABS.map((tab) => {
              const isActive = tab.value === sort;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSort(tab.value)}
                  className={`flex h-7.5 items-center rounded-[15px] px-3 font-['Inter'] text-[13px]/4.5 transition-colors sm:h-8.5 sm:rounded-[17px] sm:px-3.5 sm:text-sm/5 ${
                    isActive
                      ? "bg-[#1D293D] font-bold text-white shadow-[0_1px_3px_#00000066]"
                      : "font-semibold text-[#CAD5E2] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="min-w-1 grow" />
          <CategoryFilterMenu
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

        {/* Active search */}
        {search && (
          <div className="flex items-center gap-2 font-geist text-[13px]/4.5 text-[#8B94A5] lg:pt-4">
            <span>
              Results for <span className="font-semibold text-[#E9ECF2]">"{search}"</span>
            </span>
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="flex size-6 items-center justify-center rounded-full hover:bg-[#151A24] hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Posts */}
        <div className="flex flex-col">
          {threadsLoading ? (
            <FeedMessage>Loading discussions...</FeedMessage>
          ) : isError ? (
            <FeedMessage tone="error">
              Could not load discussions:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </FeedMessage>
          ) : threads.length === 0 ? (
            <FeedMessage>
              No discussions found.
              {search || categoryId ? (
                " Try adjusting your filters."
              ) : (
                <>
                  {" "}
                  <Link to={SUBMIT_LINK} className="font-semibold text-[#4DA3F0] hover:underline">
                    Be the first to start one.
                  </Link>
                </>
              )}
            </FeedMessage>
          ) : (
            threads.map((thread) => (
              <DiscussionCard key={thread.id} thread={thread} />
            ))
          )}
        </div>

        {/* Rules move under the feed on phone/tablet */}
        <CommunityRules className="border-t border-[#232832] pt-2.5 pb-3 sm:pt-4 lg:hidden" />
      </div>

      {/* Sidebar (desktop only) */}
      <aside className="sticky top-24 hidden w-84 shrink-0 flex-col gap-5 lg:flex">
        <section className="flex flex-col gap-4.5 rounded-lg border border-[#232832] bg-[#13161C] p-5">
          <h2 className="font-geist text-base/5.5 font-semibold text-[#F3F5F9]">
            Discussions
          </h2>
          <div className="font-geist text-sm/5.5 text-[#B4BCCB]">
            Share hot takes, react to seasonal news, or ask the community for
            recommendations.
          </div>
          <Link
            to={SUBMIT_LINK}
            className="flex h-10 items-center justify-center rounded-[20px] bg-[#0066A5] font-['Inter'] text-[15px]/5 font-bold text-white transition-colors hover:bg-[#0A74B8]"
          >
            Create post
          </Link>
        </section>

        <section className="flex flex-col pt-2">
          <h2 className="px-1 pb-2 font-geist text-sm/5 font-semibold text-[#F3F5F9]">
            Categories
          </h2>
          {[{ id: "", name: "All" }, ...categories].map((cat) => {
            const isActive = cat.id === categoryId;
            return (
              <button
                key={cat.id || "all"}
                type="button"
                aria-pressed={isActive}
                onClick={() => setCategoryId(cat.id)}
                className={`flex h-9.5 shrink-0 items-center rounded-lg px-3 text-left font-geist text-sm/5 transition-colors ${
                  isActive
                    ? "bg-[#171B22] font-semibold text-[#4DA3F0]"
                    : "font-medium text-[#E9ECF2] hover:bg-[#13161C]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </section>

        <CommunityRules className="border-t border-[#232832] pt-4" />
      </aside>
    </div>
  );
}

function FeedMessage({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={`py-10 text-center font-geist text-sm ${
        tone === "error" ? "text-red-300" : "text-[#8B94A5]"
      }`}
    >
      {children}
    </div>
  );
}

function CommunityRules({ className = "" }: { className?: string }) {
  return (
    <section className={`flex flex-col ${className}`}>
      <h2 className="px-0.5 pb-1.5 font-geist text-[13px]/4.75 font-semibold text-[#F3F5F9] sm:px-1 sm:pb-2 sm:text-sm/5">
        Community rules
      </h2>
      <ol>
        {COMMUNITY_RULES.map((rule, i) => (
          <li
            key={rule}
            className="flex min-h-10 items-center gap-2.5 border-b border-[#1B1F27] px-0.5 last:border-b-0 sm:min-h-11 sm:gap-3 sm:px-1"
          >
            <span className="w-3 shrink-0 font-geist-mono text-[11px]/3.75 text-[#8B94A5] sm:w-3.5 sm:text-xs/4">
              {i + 1}
            </span>
            <span className="grow font-geist text-[13px]/4.75 text-[#D5DAE4] sm:text-sm/5">
              {rule}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
