import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("glass-panel rounded-[var(--radius-card)] p-6", className)}>{children}</div>;
}

export function CardTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h2 className={cn("text-xl font-semibold tracking-[-0.02em] text-[var(--foreground-strong)]", className)}>{children}</h2>;
}

export function CardDescription({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <p className={cn("text-sm leading-6 text-[var(--muted-strong)]", className)}>{children}</p>;
}
