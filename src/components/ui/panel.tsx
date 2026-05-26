import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
};

export function Panel({ className, inset = true, ...props }: PanelProps) {
  return (
    <div
      className={cn("premium-panel rounded-[var(--radius-panel)]", inset && "p-5 md:p-6", className)}
      {...props}
    />
  );
}
