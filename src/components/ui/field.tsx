import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Field({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <label className={cn("flex flex-col gap-2", className)}>{children}</label>;
}

export function FieldLabel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <span className={cn("text-sm font-medium text-[var(--secondary-strong)]", className)}>{children}</span>;
}

export function FieldHint({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <span className={cn("text-xs text-[var(--muted)]", className)}>{children}</span>;
}
