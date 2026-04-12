import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DiscussionsComments } from "../schemas/discussion";
import { useAuthContext } from "../services/supabase/hooks/AuthProvider";
import { supabase } from "../services/supabase/supabaseConnection";
import {
  getCommentUpvoteStatus,
  toggleCommentUpvote,
} from "../services/api/discussionService";
import CommentForm from "./CommentForm";

interface CommentThreadProps {
  comment: DiscussionsComments;
  childrenMap: Map<string | null, DiscussionsComments[]>;
  discussionId: string;
  depth?: number;
}

const MAX_DEPTH = 6;

export default function CommentThread({
  comment,
  childrenMap,
  discussionId,
  depth = 0,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const replies = childrenMap.get(comment.id) ?? [];
  const replyCount = replies.length;

  // check if user has a session for upvote status
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // fetch upvote status
  const { data: upvoteStatus } = useQuery({
    queryKey: ["commentUpvoteStatus", comment.id],
    queryFn: () => getCommentUpvoteStatus(comment.id),
    enabled: !!session,
    initialData: { upvoted: false },
  });

  const upvoted = upvoteStatus.upvoted;
  const displayCount = comment.upvote_count ?? 0;

  // toggle upvote mutation
  const { mutate: upvoteMutate, isPending: upvotePending } = useMutation({
    mutationFn: () => toggleCommentUpvote(comment.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["commentUpvoteStatus", comment.id] });
      const prevStatus = queryClient.getQueryData<{ upvoted: boolean }>(["commentUpvoteStatus", comment.id]);
      queryClient.setQueryData(["commentUpvoteStatus", comment.id], { upvoted: !upvoted });
      return { prevStatus };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevStatus) {
        queryClient.setQueryData(["commentUpvoteStatus", comment.id], context.prevStatus);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["commentUpvoteStatus", comment.id], { upvoted: data.upvoted });
      queryClient.invalidateQueries({ queryKey: ["discussionComments", discussionId] });
    },
  });

  return (
    <div className={depth > 0 ? "ml-6 border-l border-slate-700 pl-4" : ""}>
      {/* Collapse toggle bar */}
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
          title={collapsed ? "Expand thread" : "Collapse thread"}
        >
          [{collapsed ? "+" : "\u2013"}]
        </button>
        {collapsed && (
          <span className="text-xs text-slate-500">
            {comment.created_by_username || "Anonymous"}
            {replyCount > 0 && ` · ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="rounded-lg border border-slate-700 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {comment.created_by_avatar_url ? (
                <img
                  src={comment.created_by_avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {(comment.created_by_username || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <span>{comment.created_by_username || "Anonymous"}</span>
              <span>·</span>
              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-300">{comment.body}</p>
            {comment.is_spoiler && (
              <span className="text-xs text-red-400">⚠️ Spoiler</span>
            )}

            {/* Actions row: upvote + reply */}
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => upvoteMutate()}
                disabled={upvotePending}
                className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                  upvoted ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span>▲</span>
                <span>{displayCount}</span>
              </button>

              {user && depth < MAX_DEPTH && (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showReplyForm ? "Cancel" : "Reply"}
                </button>
              )}
            </div>
          </div>

          {showReplyForm && (
            <div className="mt-2 ml-2">
              <CommentForm
                discussionId={discussionId}
                parentCommentId={comment.id}
                onSuccess={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  childrenMap={childrenMap}
                  discussionId={discussionId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
