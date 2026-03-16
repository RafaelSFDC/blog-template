import { useLoaderData } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  Twitter,
  Github,
  Linkedin,
  Rss,
  Instagram,
  Youtube,
  Facebook,
  Link as LinkIcon,
} from "lucide-react";
import type { GlobalSiteData } from "#/types/system";

export default function Footer() {
  const year = new Date().getFullYear();
  const settings = useLoaderData({ from: "__root__" }) as GlobalSiteData;
  const blogName = settings?.blogName || "Lumina";
  const footerMenu = settings?.footerMenu ?? [];
  const socialLinks = settings?.socialLinks ?? [];

  return (
    <footer className=" mt-24 border-t border-border bg-muted px-4 pb-12 pt-12 text-center text-foreground  transition-all">
      <div className="page-wrap">
        <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm font-bold">
          {(footerMenu.length > 0
            ? footerMenu
            : [
                { id: 0, label: "Stories", href: "/blog", kind: "internal" },
                { id: 1, label: "About", href: "/about", kind: "internal" },
                { id: 2, label: "Dashboard", href: "/dashboard", kind: "internal" },
              ]
          ).map((item) => (
            <Button key={item.id} asChild variant="ghost" size="sm">
              <a
                href={item.href}
                target={item.kind === "external" ? "_blank" : undefined}
                rel={item.kind === "external" ? "noopener noreferrer" : undefined}
              >
                {item.label}
              </a>
            </Button>
          ))}
        </div>
        <p className="m-0 text-sm font-medium ">
          &copy; {year} {blogName}. Made with creativity and joy.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {socialLinks.map((link, i) => {
            const platform = link.platform.toLowerCase();
            const Icon =
              (
                {
                  twitter: Twitter,
                  x: Twitter,
                  github: Github,
                  linkedin: Linkedin,
                  instagram: Instagram,
                  youtube: Youtube,
                  facebook: Facebook,
                } as Record<string, typeof Twitter>
              )[platform] || LinkIcon;

            return (
              <Button
                key={i}
                asChild
                variant="outline"
                size="icon"
                className="size-12 rounded-2xl shadow-sm hover:shadow-md"
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span className="sr-only">{link.platform}</span>
                  <Icon size={20} />
                </a>
              </Button>
            );
          })}

        <Button
          asChild
          variant="outline"
          size="icon"
          className="size-12 rounded-2xl shadow-sm hover:shadow-md"
        >
          <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
            <span className="sr-only">RSS Feed</span>
            <Rss size={20} />
          </a>
        </Button>
      </div>
    </footer>
  );
}
