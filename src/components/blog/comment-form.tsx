import { authClient } from "#/lib/auth-client";
import { LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";

import React, { useState } from "react";
import { Button } from "#/components/ui/button";
import { TurnstileField } from "#/components/security/turnstile-field";
import { Textarea } from "#/components/ui/textarea";
import { toast } from "sonner";
import { captureClientException } from "#/lib/sentry-client";

interface CommentFormProps {
  postId: number;
  onSubmit: (data: {
    authorName: string;
    authorEmail: string | undefined;
    content: string;
    turnstileToken: string;
  }) => Promise<void>;
}

export function CommentForm({ onSubmit }: Omit<CommentFormProps, "postId">) {
  const { data: session } = authClient.useSession();
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to pre-fill if session exists
  React.useEffect(() => {
    if (session?.user) {
      setAuthorName(session.user.name || "");
      setAuthorEmail(session.user.email || "");
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalName = session?.user?.name || authorName.trim();
    const finalEmail = session?.user?.email || authorEmail.trim();

    if (!finalName || !content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        authorName: finalName,
        authorEmail: finalEmail || undefined,
        content: content.trim(),
        turnstileToken,
      });
      setContent("");
      setTurnstileToken("");
      toast.success("Your comment is awaiting moderation!");
    } catch (err) {
      captureClientException(err, {
        tags: {
          area: "public",
          flow: "comment-submit",
        },
      });
      console.error(err);
      toast.error("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    return (
      <div className="bg-muted/30 border border-dashed border-border/60 rounded-md p-10 text-center space-y-4">
        <h3 className="text-xl font-bold tracking-tight">
          Want to join the discussion?
        </h3>
        <p className="text-muted-foreground text-sm font-medium">
          Please sign in to post a comment and connect with the community.
        </p>
        <Button asChild variant="default" size="lg" className="h-12 px-8">
          <Link
            to="/auth/login"
            className="flex items-center gap-2 no-underline"
          >
            <LogIn size={18} /> Sign In to Comment
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {session ? (
        <div className="flex items-center gap-3 mb-6 bg-primary/5 p-4 rounded-md border border-primary/10">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black  text-xs">
            {session.user.name?.[0] || "U"}
          </div>
          <div>
            <p className="text-[10px] font-black  tracking-widest text-primary">
              Commenting as
            </p>
            <p className="font-bold text-foreground leading-none">
              {session.user.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Form fields for guest (though we currently block guests in the if(!session) above) */}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-bold text-foreground">
          Comment *
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you think about this story?"
          required
          className="min-h-[120px]  border-input bg-background font-bold focus:border-primary/50 transition-all p-4"
        />
      </div>
      <TurnstileField
        action="comment_submit"
        value={turnstileToken}
        onTokenChange={setTurnstileToken}
      />
      <Button type="submit" disabled={isSubmitting} variant="default" size="lg">
        {isSubmitting ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
}
