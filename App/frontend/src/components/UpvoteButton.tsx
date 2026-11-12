import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase/supabaseConnection";
import { getUpvoteStatus, toggleUpvote } from "../services/api/discussionService";
import { ArrowBigUp } from "lucide-react";
import { compactNumber } from "../utilities/timeAgo";

interface UpvoteButtonProps {
  discussionId: string;
  initialCount: number;
  variant?: "default" | "pill";
}

export default function UpvoteButton({
  discussionId,
  initialCount,
  variant = "default",
}: UpvoteButtonProps) {
  const queryClient = useQueryClient();

  // Only fetch upvote status when there is an active session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ["upvoteStatus", discussionId],
    queryFn: () => getUpvoteStatus(discussionId),
    enabled: !!session,
    initialData: { upvoted: false },
  });

  const upvoted = statusData.upvoted;

  // Read the current displayed count from the discussion cache if available,
  // falling back to the prop passed in at render time.
  const cachedDiscussion = queryClient.getQueryData<{ upvote_count: number }>(["discussion", discussionId]);
  const displayCount = cachedDiscussion?.upvote_count ?? initialCount;

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleUpvote(discussionId),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["upvoteStatus", discussionId] });
      await queryClient.cancelQueries({ queryKey: ["discussion", discussionId] });

      // Snapshot previous values for rollback
      const prevStatus = queryClient.getQueryData<{ upvoted: boolean }>(["upvoteStatus", discussionId]);
      const prevDiscussion = queryClient.getQueryData<{ upvote_count: number }>(["discussion", discussionId]);

      // Optimistic update
      queryClient.setQueryData(["upvoteStatus", discussionId], { upvoted: !upvoted });
      if (prevDiscussion) {
        queryClient.setQueryData(["discussion", discussionId], {
          ...prevDiscussion,
          upvote_count: prevDiscussion.upvote_count + (upvoted ? -1 : 1),
        });
      }

      return { prevStatus, prevDiscussion };
    },
    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.prevStatus) {
        queryClient.setQueryData(["upvoteStatus", discussionId], context.prevStatus);
      }
      if (context?.prevDiscussion) {
        queryClient.setQueryData(["discussion", discussionId], context.prevDiscussion);
      }
    },
    onSuccess: (data) => {
      // Sync cache with real server values
      queryClient.setQueryData(["upvoteStatus", discussionId], { upvoted: data.upvoted });
      queryClient.setQueryData<{ upvote_count: number }>(["discussion", discussionId], (old) =>
        old ? { ...old, upvote_count: data.upvote_count } : old,
      );
      // Refresh the list so card counts update too
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
  });

  // rounded pill used in the discussion feed (matches the v2 rounded design)
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          mutate();
        }}
        disabled={isPending}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove upvote" : "Upvote"}
        className="group flex h-7 items-center gap-px rounded-[14px] bg-[#13161C] px-1 transition-colors hover:bg-[#1B2029] sm:h-8 sm:gap-0.5 sm:rounded-2xl sm:bg-transparent sm:px-1.5 sm:hover:bg-[#13161C]"
      >
        <ArrowBigUp
          strokeWidth={1.75}
          className={`size-[17px] shrink-0 sm:size-5 ${
            upvoted
              ? "fill-[#4DA3F0] text-[#4DA3F0]"
              : "text-[#8B94A5] group-hover:text-[#4DA3F0]"
          }`}
        />
        <span
          className={`w-8 shrink-0 text-center font-['Inter'] text-[13px]/4.25 font-bold sm:w-9 sm:text-sm/4.5 ${
            upvoted ? "text-[#5AA9F0]" : "text-white"
          }`}
        >
          {compactNumber(displayCount)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutate();
      }}
      disabled={isPending}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
        upvoted ? "text-white" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      <span>▲</span>
      <span>{displayCount}</span>
    </button>
  );
}
