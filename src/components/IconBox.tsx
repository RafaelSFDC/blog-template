import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "#/lib/utils";

const iconBoxVariants = cva(
  "inline-flex items-center justify-center border transition-all shrink-0",
  {
    variants: {
      variant: {
        muted: "bg-muted/50 border-border text-muted-foreground",
        primary: "bg-primary/10 border-primary/20 text-primary",
        outline: "bg-transparent border-border text-foreground",
      },
      size: {
        sm: "h-12 w-12",
        md: "h-16 w-16",
        lg: "h-24 w-24",
      },
      rounded: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      animation: {
        none: "",
        rotate: "rotate-3 hover:rotate-6 transition-transform",
        "rotate-soft": "hover:rotate-6 transition-transform",
      },
    },
    defaultVariants: {
      variant: "muted",
      size: "md",
      rounded: "md",
      animation: "none",
    },
  },
);

export interface IconBoxProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconBoxVariants> {
  icon: LucideIcon;
  iconClassName?: string;
  strokeWidth?: number;
}

export function IconBox({
  icon: Icon,
  variant,
  size,
  rounded,
  animation,
  className,
  iconClassName,
  strokeWidth = 2.5,
  ...props
}: IconBoxProps) {
  // Determine icon size based on container size
  const iconSize = size === "lg" ? 48 : size === "md" ? 32 : 24;

  return (
    <div
      className={cn(
        iconBoxVariants({ variant, size, rounded, animation }),
        className,
      )}
      {...props}
    >
      <Icon
        size={iconSize}
        strokeWidth={strokeWidth}
        className={cn(
          variant === "muted" && "text-muted-foreground",
          iconClassName,
        )}
      />
    </div>
  );
}
