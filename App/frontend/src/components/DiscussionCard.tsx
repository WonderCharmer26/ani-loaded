import { Link } from "react-router-dom";
import type { Discussion } from "../schemas/discussion";
import UpvoteButton from "./UpvoteButton";

export default function DiscussionCard({ thread }: { thread: Discussion }) {

  // trim the title of the anime
  const title = thread.title.trim().split(/\s+/);
  //title preview to format and make sure the sentence not greater than 6
  const titlePreview = title.length > 6 ? `${title.splice(0, 6).join(" ")}...` : thread.title;

  return (
    <Link to={`/discussion/${thread.id}`}>
      <article className="transition-transform hover:scale-105 cursor-pointer">
        <img
          className="w-full h-52 object-cover rounded-xl"
          src={thread.thumbnail_url ?? "/placeholder.webp"}
          alt={thread.title}
        />
        <div className="flex flex-col items-start gap-1">
          {/*Add in user logo*/}
          <h3 className="mt-3 text-md font-semibold text-white">
            {titlePreview}
          </h3>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>{thread.comment_count} replies</span>
            <span>·</span>
            <UpvoteButton discussionId={thread.id} initialCount={thread.upvote_count} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400"></div>
      </article>
    </Link>
  );
}
