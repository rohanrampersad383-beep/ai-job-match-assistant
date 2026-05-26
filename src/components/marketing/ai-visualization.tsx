import { ArrowUpRight, CheckCircle2, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const opportunities = [
  {
    role: "Product AI Strategist",
    company: "Remote-first SaaS",
    score: "94",
    signal: "Strong strategy + analytics overlap",
    tone: "primary"
  },
  {
    role: "Growth Systems Lead",
    company: "Climate intelligence",
    score: "88",
    signal: "High remote compatibility",
    tone: "cyan"
  },
  {
    role: "Career Ops Manager",
    company: "Talent platform",
    score: "81",
    signal: "Skill-gap: compensation ops",
    tone: "violet"
  }
] as const;

const signalNodes = [
  { label: "Skills", x: "14%", y: "28%" },
  { label: "Remote", x: "78%", y: "18%" },
  { label: "Salary", x: "84%", y: "70%" },
  { label: "Trajectory", x: "18%", y: "76%" }
] as const;

export function AIVisualization({ className }: { className?: string }) {
  return (
    <div className={cn("relative min-h-[560px] overflow-hidden rounded-[var(--radius-panel)]", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(47,107,255,0.28),transparent_32%),radial-gradient(circle_at_64%_58%,rgba(139,92,246,0.22),transparent_28%),linear-gradient(180deg,rgba(16,23,34,0.9),rgba(8,11,17,0.95))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />

      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" viewBox="0 0 640 560" preserveAspectRatio="none">
        <defs>
          <linearGradient id="matchiq-signal-line" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#22d3ee" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#2f6bff" stopOpacity="0.72" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <path className="landing-signal-line" d="M104 160 C 208 80, 400 86, 514 136" />
        <path className="landing-signal-line delay-1" d="M116 420 C 246 300, 372 300, 540 392" />
        <path className="landing-signal-line delay-2" d="M112 172 C 236 252, 386 280, 532 390" />
        <circle className="landing-pulse" cx="320" cy="274" r="126" />
        <circle className="landing-pulse delay-1" cx="320" cy="274" r="172" />
      </svg>

      <div className="relative z-[1] grid min-h-[560px] gap-5 p-5 sm:p-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex flex-col justify-between gap-5">
          <div className="premium-panel motion-stagger rounded-[1.25rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="discovery">Live fit engine</Badge>
              <span className="font-mono text-xs text-[var(--muted)]">SIGNALS: 128</span>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">Career intelligence score</p>
                <p className="mt-1 font-display text-6xl font-semibold text-[var(--foreground-strong)]">92</p>
              </div>
              <div className="relative size-28 shrink-0 rounded-full border border-[var(--border-glow)] bg-[conic-gradient(from_90deg,#22d3ee_0deg,#2f6bff_210deg,rgba(255,255,255,0.08)_211deg)] p-2 shadow-[var(--shadow-glow)]">
                <div className="grid size-full place-items-center rounded-full bg-[var(--background-elevated)]">
                  <Target className="size-8 text-[var(--accent-cyan)]" />
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              {["Role trajectory aligned", "Remote fit validated", "Skill gap is recoverable"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted-strong)]">
                  <CheckCircle2 className="size-4 text-[var(--success)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {signalNodes.map((node) => (
              <div key={node.label} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[rgba(16,23,34,0.72)] p-3">
                <p className="text-xs uppercase text-[var(--muted)]">{node.label}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: node.label === "Salary" ? "68%" : "86%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px]">
          {signalNodes.map((node) => (
            <div
              key={node.label}
              className="landing-node absolute hidden rounded-full border border-[var(--border-glow)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-[var(--shadow-glow)] sm:block"
              style={{ left: node.x, top: node.y }}
            >
              {node.label}
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 hidden size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[rgba(8,11,17,0.82)] shadow-[var(--shadow-strong)] sm:grid sm:place-items-center">
            <div className="grid size-24 place-items-center rounded-[2rem] bg-[image:var(--gradient-brand)] shadow-[var(--shadow-glow)]">
              <Sparkles className="size-9 text-white" />
            </div>
          </div>

          <div className="relative z-[2] ml-auto flex max-w-[360px] flex-col gap-4 pt-8">
            {opportunities.map((item, index) => (
              <div
                key={item.role}
                className={cn(
                  "landing-float-card rounded-[1.25rem] border border-[var(--border)] bg-[rgba(11,16,24,0.9)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl",
                  index === 1 && "mr-8",
                  index === 2 && "ml-5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground-strong)]">{item.role}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.company}</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[image:var(--gradient-brand)] px-3 py-2 text-center text-white">
                    <p className="text-[10px] uppercase">Fit</p>
                    <p className="font-display text-2xl font-semibold">{item.score}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted-strong)]">
                  {item.signal}
                  <ArrowUpRight className="size-4 text-[var(--accent-cyan)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
