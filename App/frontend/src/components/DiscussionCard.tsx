import { Link } from "react-router-dom";
import { MessageCircle, Share } from "lucide-react";
import { toast } from "sonner";
import type { Discussion, DiscussionsCategories } from "../schemas/discussion";
import UpvoteButton from "./UpvoteButton";
import { compactNumber, timeAgo } from "../utilities/timeAgo";

interface DiscussionCardProps {
  thread: Discussion;
  category?: DiscussionsCategories;
}

// two letter badge for the category (e.g. "Hot Takes" -> "HT", "Seasonal" -> "SE")
function categoryInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function DiscussionCard({
  thread,
  category,
}: DiscussionCardProps) {
  const href = `/discussion/${thread.id}`;
  const authorName = thread.author_username?.trim();

  const handleShare = async () => {
    const url = `${window.location.origin}${href}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <article className="flex flex-col gap-2 border-b border-[#232832] pt-4 pb-3.5 last:border-b-0 sm:gap-2.5 sm:pt-5.5 sm:pb-4.5">
      {/* Title, image and body link to the thread */}
      <Link to={href} className="group flex flex-col gap-2 sm:gap-2.5">
        <h2 className="font-geist text-[17px]/5.5 font-semibold tracking-[-0.01em] text-[#F3F5F9] transition-colors group-hover:text-white sm:text-xl/6.75 lg:text-[22px]/7.25">
          {thread.title}
        </h2>
        {/* Meta: category + author + time */}
        <div className="flex min-w-0 items-center gap-1.75 font-geist text-xs/4.25 sm:gap-2 sm:text-[13px]/4.5">
          {category && (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-[#1D3550] text-[10px]/3.25 font-semibold text-[#8CC4F5] sm:size-5.5 sm:rounded-[11px] sm:text-[11px]/3.5">
                {categoryInitials(category.name)}
              </span>
              <span className="shrink-0 font-semibold text-[#E9ECF2]">
                {category.name}
              </span>
            </>
          )}
          {authorName && (
            <span className="hidden font-semibold truncate text-[#8B94A5] sm:inline">
              {authorName}
            </span>
          )}
          {thread.is_spoiler && (
            <span className="rounded-full border border-[#5A2A2A] px-2 text-[11px]/4.5 font-semibold text-[#F28B8B]">
              Spoiler
            </span>
          )}
          <time
            dateTime={thread.created_at}
            className="shrink-0 text-[#8B94A5]"
          >
            <span className="sm:hidden">
              {timeAgo(thread.created_at, "short")}
            </span>
            <span className="hidden sm:inline">
              {timeAgo(thread.created_at)}
            </span>
          </time>
        </div>

        {thread.thumbnail_url ? (
          <div className="overflow-hidden rounded-lg">
            <img
              src={thread.thumbnail_url}
              alt={thread.title}
              loading="lazy"
              className={`h-55 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-75 lg:h-85 ${
                thread.is_spoiler ? "blur-xl" : ""
              }`}
            />
          </div>
        ) : (
          thread.body && (
            <div className="line-clamp-3 font-geist text-sm/5.25 text-[#B4BCCB] sm:text-[15px]/6">
              {thread.body}
            </div>
          )
        )}
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-0.5 sm:gap-2">
        <UpvoteButton
          discussionId={thread.id}
          initialCount={thread.upvote_count}
          variant="pill"
        />

        <Link
          to={href}
          aria-label={`${thread.comment_count} comments`}
          className="flex h-7 items-center gap-1.5 rounded-[14px] px-2.5 transition-colors hover:bg-[#13161C] sm:h-8 sm:gap-2 sm:rounded-2xl sm:px-3"
        >
          <MessageCircle
            strokeWidth={1.75}
            className="size-[15px] shrink-0 text-[#B4BCCB] sm:size-[17px]"
          />
          <span className="font-['Inter'] text-xs/4.25 font-semibold text-[#90A1B9] sm:text-[13px]/4.5">
            {compactNumber(thread.comment_count)}
          </span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share"
          className="flex size-7 shrink-0 items-center justify-center gap-2 rounded-[14px] transition-colors hover:bg-[#13161C] sm:h-8 sm:w-auto sm:rounded-2xl sm:px-3"
        >
          <Share
            strokeWidth={1.75}
            className="size-[15px] shrink-0 text-[#B4BCCB] sm:size-[17px]"
          />
          <span className="hidden font-['Inter'] text-[13px]/4.5 font-semibold text-[#90A1B9] sm:inline">
            Share
          </span>
        </button>
      </div>
    </article>
  );
}
