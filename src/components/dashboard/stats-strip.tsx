import { BriefcaseBusiness, EyeOff, Heart, Send } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const icons = [BriefcaseBusiness, Heart, EyeOff, Send];
const toneMap = {
  neutral: {
    panel: "border-[var(--border)] bg-[var(--surface)]",
    icon: "bg-[var(--surface-muted)] text-[var(--secondary)]"
  },
  success: {
    panel: "border-[var(--success)]/20 bg-[var(--success)]/8",
    icon: "bg-[var(--success)]/14 text-[var(--success)]"
  },
  primary: {
    panel: "border-[var(--primary)]/22 bg-[var(--primary)]/8",
    icon: "bg-[var(--primary)]/14 text-[var(--primary)]"
  },
  info: {
    panel: "border-[var(--info)]/22 bg-[var(--info)]/8",
    icon: "bg-[var(--info)]/14 text-[var(--info)]"
  },
  warning: {
    panel: "border-[var(--warning)]/24 bg-[var(--warning)]/8",
    icon: "bg-[var(--warning)]/16 text-[var(--warning)]"
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
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold  text-[var(--foreground)]">{stat.value}</p>
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
