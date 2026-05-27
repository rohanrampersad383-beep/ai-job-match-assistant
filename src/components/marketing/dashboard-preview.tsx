import { ArrowUpRight, Brain, LineChart, Radar, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const pipeline = [
  { label: "High-fit", value: 18, width: "84%" },
  { label: "Needs review", value: 7, width: "46%" },
  { label: "Skill gap", value: 4, width: "32%" }
];

const recommendations = [
  "Prioritize AI operations roles with analytics ownership.",
  "Remote-first companies show strongest salary-fit overlap.",
  "Add portfolio proof for lifecycle marketing systems."
];

export function DashboardPreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
      <Card className="motion-signal-surface relative overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-[var(--muted)]">Intelligence dashboard</p>
              <CardTitle className="mt-1">Opportunity command center</CardTitle>
            </div>
            <Badge variant="info">Preview</Badge>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)]/16 text-[var(--primary-soft)]">
                <Radar className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Compatibility trend</p>
                <p className="text-xs text-[var(--muted)]">Last 30 days</p>
              </div>
            </div>
            <div className="mt-8 flex h-36 items-end gap-2">
              {[34, 52, 44, 68, 73, 88, 76, 94].map((height, index) => (
                <div key={index} className="motion-bar-fill flex-1 rounded-t-full bg-[image:var(--gradient-brand)] opacity-80" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {pipeline.map((item) => (
              <div key={item.label} className="interactive-card rounded-[1.25rem] border border-[var(--border)] bg-[rgba(16,23,34,0.72)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.label}</span>
                  <span className="font-mono text-[var(--muted)]">{item.value}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div className="motion-progress-fill h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="motion-depth-strong p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">AI recommendations</p>
            <CardTitle className="mt-1">Next best moves</CardTitle>
          </div>
          <div className="grid size-11 place-items-center rounded-[var(--radius-lg)] bg-[var(--accent)]/16 text-[var(--accent-cyan)]">
            <Brain className="size-5" />
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {recommendations.map((item) => (
            <div key={item} className="interactive-card flex items-start gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--accent-cyan)]" />
              <p className="text-sm leading-6 text-[var(--muted-strong)]">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[1rem] border border-[var(--border-glow)] bg-[var(--primary)]/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground-strong)]">Recruiter demand signal</p>
              <CardDescription className="mt-1">Growth roles with AI workflow ownership are trending up.</CardDescription>
            </div>
            <LineChart className="size-6 text-[var(--primary-soft)]" />
          </div>
        </div>
        <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)]" href="/sign-up">
          Explore the workflow <ArrowUpRight className="size-4" />
        </a>
      </Card>
    </div>
  );
}
