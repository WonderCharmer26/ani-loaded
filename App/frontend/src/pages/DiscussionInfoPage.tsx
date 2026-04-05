import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscussionById,
  getDiscussionComments,
  updateDiscussion,
  deleteDiscussion,
} from "../services/api/discussionService";
import type { DiscussionsComments } from "../schemas/discussion";
import { useAuthContext } from "../services/supabase/hooks/AuthProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import UpvoteButton from "../components/UpvoteButton";
import CommentForm from "../components/CommentForm";
import CommentThread from "../components/CommentThread";
import { toast } from "sonner";

// builds a tree from flat comments and renders threaded view
function ThreadedComments({
  comments,
  commentsLoading,
  discussionId,
}: {
  comments: DiscussionsComments[];
  commentsLoading: boolean;
  discussionId: string;
}) {
  // group comments by parent_comment_id
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, DiscussionsComments[]>();
    for (const comment of comments) {
      const parentId = comment.parent_comment_id ?? null;
      const existing = map.get(parentId) ?? [];
      existing.push(comment);
      map.set(parentId, existing);
    }
    return map;
  }, [comments]);

  // top-level comments have no parent
  const topLevel = childrenMap.get(null) ?? [];

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold text-white">
        Comments ({comments.length})
      </h2>

      {commentsLoading ? (
        <p className="text-sm text-slate-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              childrenMap={childrenMap}
              discussionId={discussionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscussionInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Fetch discussion data
  const { data: discussion, isLoading: discussionLoading } = useQuery({
    queryKey: ["discussion", id],
    queryFn: () => getDiscussionById(id!),
    enabled: !!id,
  });

  // Fetch comments data
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["discussionComments", id],
    queryFn: () => getDiscussionComments(id!),
    enabled: !!id,
  });

  // check if current user is the author
  const isAuthor = user && discussion?.created_by === user.id;

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: () => updateDiscussion(id!, { title: editTitle, body: editBody }),
    onSuccess: () => {
      toast.success("Discussion updated!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["discussion", id] });
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscussion(id!),
    onSuccess: () => {
      toast.success("Discussion deleted!");
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      navigate("/discussions");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    },
  });

  const handleStartEdit = () => {
    if (!discussion) return;
    setEditTitle(discussion.title);
    setEditBody(discussion.body);
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this discussion? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (discussionLoading) {
    return <LoadingSpinner />;
  }

  if (!discussion) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-white">Discussion not found</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Discussion Header */}
        <div className="space-y-4">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Discussion title"
              className="w-full text-4xl font-bold bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-slate-500 focus:outline-none"
            />
          ) : (
            <h1 className="text-4xl font-bold text-white">{discussion.title}</h1>
          )}

          {/* Author actions */}
          {isAuthor && !isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartEdit}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {editMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {discussion.thumbnail_url && (
          <img
            src={discussion.thumbnail_url}
            alt={discussion.title}
            className="w-full h-96 object-cover rounded-xl"
          />
        )}

        {/* Discussion stats */}
        <div className="flex gap-4 text-sm text-slate-400">
          <span>{discussion.comment_count} replies</span>
          <span>·</span>
          <UpvoteButton discussionId={id!} initialCount={discussion.upvote_count} />
          <span>·</span>
          <span>
            Posted {new Date(discussion.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Discussion Body */}
        <div className="text-slate-300">
          {isEditing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Discussion body"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-white focus:border-slate-500 focus:outline-none resize-none"
              rows={8}
            />
          ) : (
            <p>{discussion.body}</p>
          )}
        </div>

        {/* Comment Form */}
        {user && (
          <div className="border-t border-slate-700 pt-6">
            <CommentForm discussionId={id!} />
          </div>
        )}

        {/* Threaded Comments Section */}
        <ThreadedComments
          comments={comments}
          commentsLoading={commentsLoading}
          discussionId={id!}
        />
      </div>
    </div>
  );
}
