import { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("glass-panel motion-depth rounded-[var(--radius-card)] p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h2 className={cn("font-display text-xl font-semibold text-[var(--foreground-strong)]", className)}>{children}</h2>;
}

export function CardDescription({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <p className={cn("text-sm leading-6 text-[var(--muted-strong)]", className)}>{children}</p>;
}
