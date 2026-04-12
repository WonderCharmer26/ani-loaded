import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Discussion } from "../schemas/discussion";
import type { DiscussionQueryParams } from "../services/api/discussionService";
import {
  getAllDiscussions,
  getDiscussionCategories,
} from "../services/api/discussionService";
import type { DiscussionsCategories } from "../schemas/discussion";
import DiscussionCard from "../components/DiscussionCard";
import LinkButton from "@/components/CreateButton";

// NOTE: refresh triggered on DiscussionSubmitPage

export default function DiscussionPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<DiscussionQueryParams["sort"]>("newest");

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

  // fetch categories for filter dropdown
  const { data: categories = [] } = useQuery<DiscussionsCategories[]>({
    queryKey: ["discussionCategories"],
    queryFn: getDiscussionCategories,
  });

  return (
    <div className="px-6 py-10 space-y-10">
      <section className="space-y-3 flex flex-col items-center">
        <h1 className="text-4xl font-bold uppercase text-white">Discussions</h1>
        <p className="max-w-3xl text-slate-300">
          Share hot takes, react to seasonal news, or ask the community for
          recommendations.
        </p>
        <div className="flex items-center justify-end gap-2 w-full">
          <LinkButton link="/discussion/submit" word="Create" />
        </div>
      </section>

      {/* Search, Filter & Sort Controls */}
      <section className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search discussions..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          title="Filter by category"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as DiscussionQueryParams["sort"])}
          title="Sort discussions"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_upvoted">Most Upvoted</option>
          <option value="most_commented">Most Commented</option>
        </select>
      </section>

      <section className="flex justify-center items-center">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threadsLoading ? (
            <div className="text-sm text-slate-400">Loading threads...</div>
          ) : isError ? (
            <div className="text-sm text-red-300">
              Could not load discussions: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-sm text-slate-400">
              No discussions found.{search || categoryId ? " Try adjusting your filters." : " Be the first to start one."}
            </div>
          ) : (
            threads.map((thread) => (
              <DiscussionCard key={thread.id} thread={thread} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
