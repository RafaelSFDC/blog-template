import React, { useState } from 'react';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { toast } from 'sonner';

interface CommentFormProps {
  postId: number;
  onSubmit: (data: { authorName: string; authorEmail: string | undefined; content: string }) => Promise<void>;
}

export function CommentForm({ onSubmit }: Omit<CommentFormProps, 'postId'>) {
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        content: content.trim(),
      });
      setAuthorName('');
      setAuthorEmail('');
      setContent('');
      toast.success('Your comment is awaiting moderation!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="authorName" className="text-sm font-bold text-foreground">
            Name *
          </label>
          <Input
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="John Doe"
            required
            className="rounded-xl border-2 border-input bg-background font-bold h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="authorEmail" className="text-sm font-bold text-foreground">
            Email (optional)
          </label>
          <Input
            id="authorEmail"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="john@example.com"
            className="rounded-xl border-2 border-input bg-background font-bold h-11"
          />
        </div>
      </div>
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
          className="min-h-[120px] rounded-xl border-2 border-input bg-background font-bold"
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="zine"
        size="lg"
        className="w-full sm:w-auto h-12 rounded-xl text-lg font-black"
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  );
}
