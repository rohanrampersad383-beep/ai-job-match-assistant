import { BriefcaseBusiness, EyeOff, Heart, Send } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const icons = [BriefcaseBusiness, Heart, EyeOff, Send];
const toneMap = {
  neutral: {
    panel: "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,252,0.92)_100%)]",
    icon: "bg-[var(--muted-surface)] text-[var(--secondary)]"
  },
  success: {
    panel: "border-[rgba(31,159,136,0.15)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(236,249,245,0.96)_100%)]",
    icon: "bg-[var(--success)]/14 text-[var(--success)]"
  },
  primary: {
    panel: "border-[rgba(20,138,122,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(233,247,244,0.96)_100%)]",
    icon: "bg-[var(--primary)]/14 text-[var(--primary)]"
  },
  info: {
    panel: "border-[rgba(42,111,151,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(236,244,251,0.96)_100%)]",
    icon: "bg-[var(--info)]/14 text-[var(--info)]"
  },
  warning: {
    panel: "border-[rgba(240,180,76,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,229,0.96)_100%)]",
    icon: "bg-[var(--accent)]/22 text-[#8a6100]"
  }
} as const;

export function StatsStrip({
  stats
}: {
  stats: Array<{ label: string; value: number | string; hint?: string; tone?: keyof typeof toneMap }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = icons[index % icons.length];
        const tone = toneMap[stat.tone ?? "neutral"];
        return (
          <Card
            key={stat.label}
            className={cn("interactive-card metric-card relative overflow-hidden p-5", tone.panel)}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,rgba(20,138,122,0.45),transparent)]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{stat.value}</p>
                {stat.hint ? <p className="mt-2 text-sm text-[var(--muted-strong)]">{stat.hint}</p> : null}
              </div>
              <div className={cn("rounded-[1rem] p-3", tone.icon)}>
                <Icon className="size-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
