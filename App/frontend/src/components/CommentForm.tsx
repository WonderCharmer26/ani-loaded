import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitComment } from "../services/api/discussionService";
import { toast } from "sonner";

interface CommentFormProps {
  discussionId: string;
  parentCommentId?: string;
  onSuccess?: () => void;
}

export default function CommentForm({
  discussionId,
  parentCommentId,
  onSuccess,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => submitComment(discussionId, body, isSpoiler, parentCommentId),
    onSuccess: () => {
      setBody("");
      setIsSpoiler(false);
      toast.success("Comment posted!");
      queryClient.invalidateQueries({ queryKey: ["discussionComments", discussionId] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussionId] });
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none resize-none"
        rows={3}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isSpoiler}
            onChange={(e) => setIsSpoiler(e.target.checked)}
            className="rounded border-slate-600"
          />
          Mark as spoiler
        </label>
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
