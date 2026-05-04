import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]", {
  variants: {
    variant: {
      neutral: "border-transparent bg-[var(--muted-surface)] text-[var(--secondary)]",
      success: "border-[var(--success)]/18 bg-[var(--success)]/12 text-[var(--success)]",
      warning: "border-[#d9a441]/25 bg-[var(--accent)]/18 text-[#8a6100]",
      danger: "border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]",
      info: "border-[var(--info)]/20 bg-[var(--info)]/10 text-[var(--info)]",
      matchHigh: "border-[var(--success)]/24 bg-[var(--success)] text-white",
      matchMedium: "border-[var(--primary)]/16 bg-[var(--primary)]/14 text-[var(--primary)]",
      matchLow: "border-[#b0bac8]/28 bg-[#eef2f6] text-[#5e6d80]",
      discovery: "border-[var(--secondary)]/16 bg-[var(--secondary)]/10 text-[var(--secondary)]"
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
