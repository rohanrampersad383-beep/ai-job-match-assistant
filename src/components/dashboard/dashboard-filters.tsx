import Link from "next/link";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { DashboardFilters as DashboardFilterInput } from "@/types";

type DashboardFiltersProps = {
  defaults: Omit<DashboardFilterInput, "page">;
  sources: Array<{
    id: string;
    name: string;
  }>;
};

export function DashboardFilters({ defaults, sources }: DashboardFiltersProps) {
  const needsReviewOnly = defaults.view === "needs-review";

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,250,253,0.94)_100%)] p-7">
      <form className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Opportunity filters</p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">Shape the shortlist without wasting space.</p>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Prioritize Trinidad and Tobago roles, remote-friendly openings, and discovery-driven jobs without cluttering the dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SubmitButton type="submit" variant="secondary">
              Apply filters
            </SubmitButton>
            <Link
              className="inline-flex cursor-pointer items-center justify-center rounded-[1rem] border border-[var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              href="/dashboard"
            >
              Reset
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[repeat(4,minmax(0,1fr))_240px]">
          <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/10">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={Boolean(defaults.trinidadOnly)}
              name="trinidadOnly"
              type="checkbox"
            />
            <span>
              Trinidad and Tobago only
              <span className="mt-1 block text-xs text-[var(--muted)]">Keep the feed focused on local opportunities first.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-[var(--info)]/25 bg-[var(--info)]/8 px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--info)]/40 hover:bg-[var(--info)]/10">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={Boolean(defaults.remoteFriendlyOnly)}
              name="remoteFriendlyOnly"
              type="checkbox"
            />
            <span>
              Remote-friendly only
              <span className="mt-1 block text-xs text-[var(--muted)]">Show remote roles suitable for Trinidad and Tobago candidates.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-[var(--success)]/25 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--success)]/40 hover:bg-[var(--success)]/12">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={Boolean(defaults.discoveredOnly)}
              name="discoveredOnly"
              type="checkbox"
            />
            <span>
              Discovered only
              <span className="mt-1 block text-xs text-[var(--muted)]">Hide manual fallback entries and stay focused on automated discovery.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-[var(--accent)]/35 bg-[var(--accent)]/20 px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/24">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={needsReviewOnly}
              name="needsReviewOnly"
              type="checkbox"
            />
            <span>
              Needs review
              <span className="mt-1 block text-xs text-[var(--muted)]">Jump straight to jobs waiting for a decision.</span>
            </span>
          </label>
          <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/88 px-4 py-3 shadow-[var(--shadow-soft)]">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Minimum match score
            </label>
            <Input
              className="mt-3"
              defaultValue={typeof defaults.minMatch === "number" ? String(defaults.minMatch) : ""}
              max={100}
              min={0}
              name="minMatch"
              placeholder="70"
              type="number"
            />
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,2.6fr)_repeat(3,minmax(220px,1fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-11"
              defaultValue={defaults.query}
              name="query"
              placeholder="Search jobs, companies, locations, or keywords"
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
          <Select defaultValue={defaults.recentDays ? String(defaults.recentDays) : ""} name="recentDays">
            <option value="">Any time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
          <Select defaultValue={defaults.view === "needs-review" ? "all" : defaults.view ?? "all"} name="view">
            <option value="all">All statuses</option>
            <option value="high-match">High match</option>
            <option value="saved">Saved</option>
            <option value="reviewed">Reviewed</option>
            <option value="applied">Applied</option>
            <option value="hidden">Hidden</option>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <Select defaultValue={defaults.workMode ?? "ALL"} name="workMode">
            <option value="ALL">Any work mode</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </Select>
          <Select defaultValue={defaults.seniority ?? "ALL"} name="seniority">
            <option value="ALL">Any seniority</option>
            <option value="ENTRY">Entry</option>
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead</option>
            <option value="PRINCIPAL">Principal</option>
          </Select>
          <div className="hidden 2xl:block" />
          <div className="hidden 2xl:block" />
        </div>
      </form>
    </Card>
  );
}
