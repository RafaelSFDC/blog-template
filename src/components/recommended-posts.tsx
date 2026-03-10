import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";
import { PostCard } from "#/components/blog/PostCard";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category?: string | null;
}

interface RecommendedPostsProps {
  posts: Post[];
}

export function RecommendedPosts({ posts }: RecommendedPostsProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="bg-card border shadow-sm flex items-center justify-between rounded-md px-4 py-3 sm:px-6 transition-transform hover:-translate-y-1">
        <div>
          <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
            Também pode gostar
          </h2>
        </div>
        <Button asChild variant="outline" size="sm" className="hidden sm:flex">
          <Link
            to="/blog"
            search={{ q: "", category: "" }}
            className="flex items-center gap-2 "
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post as any} />
        ))}
      </div>
    </section>
  );
}
