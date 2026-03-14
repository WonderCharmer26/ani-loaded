import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Discussion } from "../schemas/discussion";
import {
  getAllDiscussions,
} from "../services/api/discussionService";
import DiscussionCard from "../components/DiscussionCard";

// NOTE: refresh triggered on DiscussionSubmitPage

// TODO: CONNECT THE TABLE, MAKE FUNCTIONS FOR FETCHING THE TABLES
// TODO: MAKE FORM COMPONENT TO TAKE IN NEW DISCUSSION POSTS (MAKE MODAL)
// TODO: MAKE DISCUSSION CARD THAT THE USER CAN CLICK TO TAKE THEM TO THE POST

// get the discussions data
export default function DiscussionPage() {
  // function to get all the discussions
  const { data: threads = [], isLoading: threadsLoading } = useQuery<
    Discussion[]
  >({
    queryKey: ["discussions"],
    queryFn: () => getAllDiscussions(),
  });

  // make sure that there are no dupes or null animeIDs
  const animeIDs = Array.from(new Set(threads.map((d) => d.anime_id))).filter(
    // remove cases where the ids are null or undefined
    Boolean,
  );

  return (
    <div className="px-6 py-10 space-y-10">
      <section className="space-y-3 flex flex-col items-center">
        <h1 className="text-4xl font-bold uppercase text-white">Discussions</h1>
        <p className="max-w-3xl text-slate-300">
          Share hot takes, react to seasonal news, or ask the community for
          recommendations.
        </p>
        <div className="flex items-center justify-end gap-2 w-full">
          <Link
            to={"/discussion/submit"}
            className="py-3 font-bold px-3.5 rounded-xl bg-black"
          >
            New +
          </Link>
        </div>
      </section>

      <section className="flex justify-center items-center">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threadsLoading ? (
            // This is for the loading state component, will change to other component UI later
            <div className="text-sm text-slate-400">Loading threads…</div>
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
