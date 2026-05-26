import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase", {
  variants: {
    variant: {
      neutral: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--secondary)]",
      success: "border-[var(--success)]/18 bg-[var(--success)]/12 text-[var(--success)]",
      warning: "border-[var(--warning)]/25 bg-[var(--warning)]/14 text-[var(--warning)]",
      danger: "border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]",
      info: "border-[var(--info)]/20 bg-[var(--info)]/10 text-[var(--info)]",
      matchHigh: "border-[var(--success)]/24 bg-[var(--success)] text-white",
      matchMedium: "border-[var(--primary)]/24 bg-[var(--primary)]/14 text-[var(--primary-soft)]",
      matchLow: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]",
      discovery: "border-[var(--accent-cyan)]/22 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
