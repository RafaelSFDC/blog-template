import React, { useState } from 'react';
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Mail } from "lucide-react";
import { cn } from "#/lib/utils";

interface NewsletterProps {
  title?: string;
  description?: string;
  buttonText?: string;
  placeholder?: string;
  onSubscribe?: (email: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function Newsletter({
  title = "JOIN THE TRIBE!",
  description = "No noise. Just high-energy design drops and creative insights every Sunday.",
  buttonText = "Subscribe!",
  placeholder = "your@edgy.email",
  onSubscribe,
  variant = 'default',
  className
}: NewsletterProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubscribe) {
      onSubscribe(email);
    } else {
      console.log('Newsletter subscription:', email);
      setEmail('');
      // In a real app, this would be a toast or API call
      if (typeof window !== 'undefined') {
        alert('Thanks for joining!');
      }
    }
  };

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={cn("flex flex-col sm:flex-row gap-3 max-w-md", className)}>
        <div className="relative flex-1">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="h-12 w-full rounded-lg border-2 border-input bg-background pl-11 pr-4 text-sm font-bold shadow-zine-sm outline-none focus:ring-4 focus:ring-primary/20"
          />
        </div>
        <Button 
          type="submit" 
          variant="zine" 
          size="lg" 
          className="sm:w-auto"
        >
          {buttonText === "Subscribe!" ? "Join" : buttonText}
        </Button>
      </form>
    );
  }

  return (
    <section className={cn("island-shell rounded-2xl bg-card px-4 py-8 sm:px-6 text-center border-border", className)}>
      <div className="mx-auto max-w-2xl text-foreground">
        <h3 className="display-title mb-6 text-4xl font-extrabold uppercase italic tracking-tighter sm:text-6xl text-foreground">
          {title}
        </h3>
        <p className="mb-10 text-lg font-bold sm:text-xl text-muted-foreground">
          {description}
        </p>
        
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row sm:gap-3 items-center">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="h-14 flex-1 rounded-2xl border-border bg-background px-6 text-lg font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/20"
          />
          <Button 
            type="submit"
            variant="zine"
            size="lg"
            className="h-14 rounded-2xl bg-accent px-8 text-xl font-black text-accent-foreground hover:scale-105 active:scale-95 border-border shadow-zine-sm"
          >
            {buttonText}
          </Button>
        </form>
      </div>
    </section>
  );
}
