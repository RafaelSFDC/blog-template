import { Link, useLoaderData } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Twitter, Github, Linkedin, Rss } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const settings = useLoaderData({ from: '__root__' }) as any;
  const blogName = settings?.blogName || "VibeZine";

  return (
    <footer className="site-footer mt-16 px-4 pb-12 pt-10 text-center text-muted-foreground">
      <div className="page-wrap">
        <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm font-bold">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:text-primary transition-colors font-bold"
          >
            <Link to="/blog" search={{ q: "", category: "" }}>
              Stories
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:text-secondary transition-colors font-bold"
          >
            <Link to="/about">About</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:text-accent transition-colors font-bold"
          >
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
        <p className="m-0 text-sm text-muted-foreground">
          &copy; {year} {blogName}. Made with creativity and joy.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {settings?.twitterProfile && (
          <Button
            asChild
            variant="zine-outline"
            size="icon"
            className="size-12 rounded-2xl shadow-zine-sm hover:shadow-zine-hover"
          >
            <a
              href={settings.twitterProfile}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Siga {blogName} no X</span>
              <Twitter size={20} />
            </a>
          </Button>
        )}
        
        {settings?.githubProfile && (
          <Button
            asChild
            variant="zine-outline"
            size="icon"
            className="size-12 rounded-2xl shadow-zine-sm hover:shadow-zine-hover"
          >
            <a
              href={settings.githubProfile}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">GitHub do {blogName}</span>
              <Github size={20} />
            </a>
          </Button>
        )}

        {settings?.linkedinProfile && (
          <Button
            asChild
            variant="zine-outline"
            size="icon"
            className="size-12 rounded-2xl shadow-zine-sm hover:shadow-zine-hover"
          >
            <a
              href={settings.linkedinProfile}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn do {blogName}</span>
              <Linkedin size={20} />
            </a>
          </Button>
        )}

        <Button
          asChild
          variant="zine-outline"
          size="icon"
          className="size-12 rounded-2xl shadow-zine-sm hover:shadow-zine-hover"
        >
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">RSS Feed</span>
            <Rss size={20} />
          </a>
        </Button>
      </div>
    </footer>
  );
}
