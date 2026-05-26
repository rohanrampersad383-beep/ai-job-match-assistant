import Image from "next/image";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type MatchIQLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function MatchIQLogo({
  className,
  markClassName,
  textClassName,
  showText = true
}: MatchIQLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label={brand.name}>
      <Image
        alt=""
        aria-hidden="true"
        className={cn("size-10 shrink-0 rounded-[0.85rem]", markClassName)}
        height={40}
        priority
        src={brand.assets.logoMark}
        width={40}
      />
      {showText ? (
        <span
          className={cn(
            "font-display text-xl font-semibold leading-none text-[var(--foreground-strong)]",
            textClassName
          )}
        >
          Match<span className="text-gradient-brand">IQ</span>
        </span>
      ) : null}
    </div>
  );
}
