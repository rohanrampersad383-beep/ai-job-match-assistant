import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-shimmer rounded-[var(--radius-md)] bg-[var(--surface-raised)]", className)}
      {...props}
    />
  );
}
