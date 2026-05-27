import Link from "next/link";
import { BrainCircuit, Search, SlidersHorizontal } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function ReviewQueueFilters({
  defaults,
  sources
}: {
  defaults: {
    query?: string;
    sourceId?: string;
    trinidadOnly?: boolean;
    remoteOnly?: boolean;
    highConfidenceOnly?: boolean;
    growthMatchOnly?: boolean;
    minMatch?: number;
    recentDays?: number;
    sort?: string;
  };
  sources: Array<{
    id: string;
    name: string;
  }>;
}) {
  const chips = [
    { label: "High Confidence", name: "highConfidenceOnly", checked: Boolean(defaults.highConfidenceOnly), tone: "border-[var(--accent-cyan)]/28 bg-[var(--accent-cyan)]/10" },
    { label: "Growth Match", name: "growthMatchOnly", checked: Boolean(defaults.growthMatchOnly), tone: "border-[var(--accent)]/32 bg-[var(--accent)]/16" },
    { label: "Remote Friendly", name: "remoteOnly", checked: Boolean(defaults.remoteOnly), tone: "border-[var(--info)]/28 bg-[var(--info)]/10" },
    { label: "Trinidad Relevant", name: "trinidadOnly", checked: defaults.trinidadOnly ?? true, tone: "border-[var(--success)]/28 bg-[var(--success)]/10" }
  ];

  return (
    <Card className="bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.1),transparent_30%),var(--surface)] p-5 md:p-6">
      <form className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-strong)]">
              <SlidersHorizontal className="size-4 text-[var(--accent-cyan)]" />
              Review intelligence filters
            </div>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Prioritize the roles most worth reviewing by confidence, freshness, source, and location fit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SubmitButton type="submit" variant="secondary">
              Apply filters
            </SubmitButton>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
              href="/review-queue"
            >
              Reset
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(210px,0.85fr)_minmax(170px,0.7fr)_minmax(170px,0.7fr)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-11"
              defaultValue={defaults.query}
              name="query"
              placeholder="Search title, company, location, source"
            />
          </label>
          <Select defaultValue={defaults.sourceId ?? ""} name="sourceId">
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
              ))}
          </Select>
          <Select defaultValue={String(defaults.recentDays ?? 7)} name="recentDays">
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
          <Select defaultValue={defaults.sort ?? "priority"} name="sort">
            <option value="priority">Sort by priority</option>
            <option value="confidence">Sort by confidence</option>
            <option value="match">Sort by match score</option>
            <option value="date">Sort by newest</option>
          </Select>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-wrap gap-3">
            {chips.map((chip) => (
              <label
                key={chip.name}
                className={cn(
                  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase text-[var(--secondary)] transition hover:border-[var(--border-glow)] hover:text-white",
                  chip.checked ? `${chip.tone} text-white` : "border-[var(--border)] bg-[var(--surface-muted)]"
                )}
              >
                <input
                  className="size-3.5 accent-[var(--primary)]"
                  defaultChecked={chip.checked}
                  name={chip.name}
                  type="checkbox"
                />
                {chip.label}
              </label>
            ))}
          </div>

          <label className="relative block">
            <BrainCircuit className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--accent-cyan)]" />
            <Input
              className="pl-11"
              defaultValue={typeof defaults.minMatch === "number" ? String(defaults.minMatch) : ""}
              max={100}
              min={0}
              name="minMatch"
              placeholder="Min match"
              type="number"
            />
          </label>
        </div>
      </form>
    </Card>
  );
}
