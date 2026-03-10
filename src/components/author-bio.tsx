import { User } from "lucide-react";

interface AuthorBioProps {
  author?: {
    name: string;
    image?: string | null;
    bio?: string;
    role?: string;
  };
}

export function AuthorBio({ author }: AuthorBioProps) {
  const name = author?.name || "Lumina Editorial Team";
  const bio =
    author?.bio ||
    "Passionate about digital strategy, creative coding, and the intersection of art and technology. Follow our journal for more bold updates.";
  const role = author?.role || "Content Strategist";

  return (
    <section className="bg-card border shadow-sm  flex flex-col items-center gap-6 rounded-md  px-4 py-3 sm:px-6 sm:flex-row sm:text-left">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted shadow-xl transition-transform hover:scale-105">
        {author?.image ? (
          <img
            src={author.image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
            <User className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
          Sobre o autor
        </p>
        <h3 className="display-title mb-2 text-2xl font-bold">{name}</h3>
        <p className="mb-4 text-sm font-medium text-muted-foreground">{role}</p>
        <p className="text-sm leading-relaxed text-foreground/80">{bio}</p>
      </div>
    </section>
  );
}
