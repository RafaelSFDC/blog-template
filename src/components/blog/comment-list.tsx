export interface Comment {
  id: number;
  authorName: string;
  createdAt: Date | string | null;
  content: string;
}

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <p className="text-muted-foreground font-bold ">
        Be the first to share your thoughts on this story.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-b border-border pb-6 last:border-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <p className="font-black text-foreground  text-sm tracking-wide">
              {comment.authorName}
            </p>
            <span className="text-xs text-muted-foreground opacity-50">•</span>
            <p className="text-xs font-bold text-muted-foreground ">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleDateString()
                : "Just now"}
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}
