import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  DatabaseZap,
  Filter,
  MapPin,
  Radar,
  Search,
  Sparkles,
  Target
} from "lucide-react";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { requireUser } from "@/lib/auth/session";
import { getDiscoveredJobsData, type DiscoveredJobsDataOptions } from "@/lib/data/discovery";
import {
  createDiscoveredJobRow,
  filterDiscoveredJobRows,
  sortDiscoveredJobRows,
  type DiscoveredJobConfidenceFilter,
  type DiscoveredJobSort
} from "@/lib/discovery/discovered-jobs-view";
import { explainJobMatch } from "@/lib/intelligence/career";
import { cn, formatCurrency, formatDate, titleCase } from "@/lib/utils";

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value);
  return normalized === "on" || normalized === "true" || normalized === "1";
}

function asNumber(value: string | string[] | undefined) {
  const normalized = asString(value);
  const parsed = normalized ? Number(normalized) : undefined;
  return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : undefined;
}

function normalizeStatus(value?: string): DiscoveredJobsDataOptions["status"] {
  switch (value) {
    case "needs-review":
    case "reviewed":
    case "saved":
    case "applied":
    case "hidden":
      return value;
    default:
      return "all";
  }
}

function normalizeSort(value?: string): DiscoveredJobSort {
  switch (value) {
    case "match":
    case "confidence":
    case "source":
    case "discovered":
    case "review":
      return value;
    default:
      return "priority";
  }
}

function normalizeConfidence(value?: string): DiscoveredJobConfidenceFilter {
  switch (value) {
    case "high":
    case "medium-plus":
    case "needs-work":
      return value;
    default:
      return "all";
  }
}

function matchVariant(matchPercent: number) {
  if (matchPercent >= 80) return "matchHigh";
  if (matchPercent >= 60) return "matchMedium";
  return "matchLow";
}

function statusVariant(status: string) {
  switch (status) {
    case "Needs review":
      return "warning";
    case "Reviewed":
      return "info";
    case "Saved":
      return "discovery";
    case "Applied":
      return "success";
    case "Hidden":
      return "danger";
    default:
      return "neutral";
  }
}

function confidenceVariant(tier: string) {
  if (tier === "High Confidence") return "success";
  if (tier === "Needs Review") return "warning";
  return "discovery";
}

function salaryLabel(job: { salaryMin?: number | null; salaryMax?: number | null; salaryCurrency?: string | null }) {
  if (!job.salaryMin && !job.salaryMax) {
    return "Salary not listed";
  }

  return `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`;
}

export default async function DiscoveredJobsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = asString(params.query);
  const sourceId = asString(params.sourceId);
  const status = normalizeStatus(asString(params.status));
  const sort = normalizeSort(asString(params.sort));
  const confidence = normalizeConfidence(asString(params.confidence));
  const remoteOnly = asBoolean(params.remoteOnly);
  const trinidadOnly = asBoolean(params.trinidadOnly);
  const highMatchOnly = asBoolean(params.highMatchOnly);
  const needsReviewOnly = asBoolean(params.needsReviewOnly);
  const recentDays = asNumber(params.recentDays);

  const data = await getDiscoveredJobsData(user.id, {
    query,
    sourceId,
    status,
    remoteOnly,
    trinidadOnly,
    highMatchOnly,
    recentDays
  });

  const allRows = data.jobs.map((job) => createDiscoveredJobRow(job, explainJobMatch(job)));
  const rows = sortDiscoveredJobRows(
    filterDiscoveredJobRows(allRows, {
      confidence,
      remoteOnly,
      trinidadOnly,
      highMatchOnly,
      needsReviewOnly,
      sourceId
    }),
    sort
  );
  const activeFilterCount = [
    query,
    sourceId,
    status !== "all",
    confidence !== "all",
    remoteOnly,
    trinidadOnly,
    highMatchOnly,
    needsReviewOnly,
    recentDays
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discovered jobs"
        title="Inspect every imported opportunity"
        description="A table-first source review surface for scanning discovered roles by match, confidence, source, freshness, and review state before deciding what belongs in the queue."
        actions={
          <>
            <DiscoveryActionForm
              action={runAllDiscoverySourcesFeedbackAction}
              label="Run discovery now"
              pendingLabel="Running discovery..."
            />
            <Link
              className="inline-flex cursor-pointer rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface-raised)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary)]"
              href="/review-queue"
            >
              Review queue
            </Link>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Visible rows", value: rows.length, hint: `${data.total} discovered in query`, icon: DatabaseZap, tone: "text-[var(--accent-cyan)]" },
          { label: "Needs review", value: data.summary.needsReview, hint: "Awaiting decision", icon: Target, tone: "text-[var(--warning)]" },
          { label: "High match", value: data.summary.highMatch, hint: "80% or better", icon: Radar, tone: "text-[var(--success)]" },
          { label: "Remote fit", value: data.summary.remote, hint: "Remote-ready roles", icon: Sparkles, tone: "text-[var(--info)]" },
          { label: "Reviewed", value: data.summary.reviewed, hint: "Decision recorded", icon: CheckCircle2, tone: "text-[var(--primary-soft)]" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="interactive-card motion-signal-surface bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted-strong)]">{item.hint}</p>
                </div>
                <span className={cn("grid size-10 place-items-center rounded-[var(--radius-md)] bg-white/6", item.tone)}>
                  <Icon className="size-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="motion-signal-surface bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.1),transparent_30%),var(--surface)] p-5">
        <form className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-strong)]">
                <Filter className="size-4 text-[var(--accent-cyan)]" />
                Discovery table filters
              </div>
              <p className="mt-1 text-sm text-[var(--secondary)]">
                Filter the imported job universe without changing the underlying ranking engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SubmitButton type="submit" variant="secondary">
                Apply filters
              </SubmitButton>
              <Link
                className="motion-press inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
                href="/discovered-jobs"
              >
                Reset
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(150px,0.7fr))]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input className="pl-11" defaultValue={query} name="query" placeholder="Search title, company, source, skill" />
            </label>
            <Select defaultValue={sourceId ?? ""} name="sourceId">
              <option value="">All sources</option>
              {data.sources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </Select>
            <Select defaultValue={status} name="status">
              <option value="all">Active discovered</option>
              <option value="needs-review">Needs review</option>
              <option value="reviewed">Reviewed</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="hidden">Hidden</option>
            </Select>
            <Select defaultValue={confidence} name="confidence">
              <option value="all">All confidence</option>
              <option value="high">High confidence</option>
              <option value="medium-plus">Medium+</option>
              <option value="needs-work">Needs work</option>
            </Select>
            <Select defaultValue={sort} name="sort">
              <option value="priority">Sort by priority</option>
              <option value="match">Sort by match score</option>
              <option value="confidence">Sort by confidence</option>
              <option value="source">Sort by source</option>
              <option value="discovered">Sort by discovered date</option>
              <option value="review">Sort by review state</option>
            </Select>
            <Select defaultValue={recentDays ? String(recentDays) : ""} name="recentDays">
              <option value="">All time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "Remote Friendly", name: "remoteOnly", checked: remoteOnly },
              { label: "Trinidad Friendly", name: "trinidadOnly", checked: trinidadOnly },
              { label: "High Match", name: "highMatchOnly", checked: highMatchOnly },
              { label: "Needs Review", name: "needsReviewOnly", checked: needsReviewOnly }
            ].map((chip) => (
              <label
                key={chip.name}
                className={cn(
                  "motion-press inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase text-[var(--secondary)] transition hover:border-[var(--border-glow)] hover:text-white",
                  chip.checked ? "border-[var(--accent-cyan)]/28 bg-[var(--accent-cyan)]/10 text-white" : "border-[var(--border)] bg-[var(--surface-muted)]"
                )}
              >
                <input className="size-3.5 accent-[var(--primary)]" defaultChecked={chip.checked} name={chip.name} type="checkbox" />
                {chip.label}
              </label>
            ))}
            {activeFilterCount ? <Badge variant="discovery">{activeFilterCount} active filters</Badge> : null}
          </div>
        </form>
      </Card>

      {rows.length ? (
        <Card className="motion-signal-surface overflow-hidden border-[var(--border)] bg-[rgba(11,16,24,0.88)] p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BriefcaseBusiness className="size-4 text-[var(--accent-cyan)]" />
                Discovered opportunity table
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Quick-scan rows inspired by table workflows, with mobile cards below desktop width.
              </p>
            </div>
            <Badge variant="neutral">Sorted by {sort === "priority" ? "AI priority" : sort}</Badge>
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Opportunity</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">State</th>
                  <th className="px-4 py-3 font-semibold">Next action</th>
                  <th className="px-5 py-3 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row) => (
                  <tr key={row.job.id} className="transition hover:bg-white/[0.035]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{row.job.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{row.job.company}</p>
                      <p className="mt-2 text-xs text-[var(--muted-strong)]">{salaryLabel(row.job)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={matchVariant(row.matchPercent)}>{row.matchPercent}%</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-36">
                        <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                          <span>{row.confidenceTier}</span>
                          <span>{row.confidenceScore}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${row.confidenceScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="discovery">{row.sourceLabel}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <p className="flex items-center gap-1.5 text-xs text-[var(--secondary)]">
                        <MapPin className="size-3.5 text-[var(--muted)]" />
                        {row.job.location}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {row.isRemoteFit ? <Badge className="px-2 py-1 text-[10px]" variant="info">Remote</Badge> : null}
                        {row.isTrinidadFit ? <Badge className="px-2 py-1 text-[10px]" variant="success">Trinidad</Badge> : null}
                        {row.job.workMode ? <Badge className="px-2 py-1 text-[10px]" variant="neutral">{titleCase(row.job.workMode)}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusVariant(row.reviewState)}>{row.reviewState}</Badge>
                      <p className="mt-2 text-xs text-[var(--muted)]">Discovered {formatDate(row.job.discoveredAt)}</p>
                    </td>
                    <td className="max-w-sm px-4 py-4 text-xs leading-5 text-[var(--muted-strong)]">{row.nextStep}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--secondary)] transition hover:border-[var(--border-glow)] hover:text-white"
                        href={`/jobs/${row.job.id}`}
                      >
                        Inspect
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 xl:hidden">
            {rows.map((row) => (
              <article key={row.job.id} className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{row.job.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{row.job.company} - {row.sourceLabel}</p>
                  </div>
                  <Badge variant={matchVariant(row.matchPercent)}>{row.matchPercent}%</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={confidenceVariant(row.confidenceTier)}>{row.confidenceTier}</Badge>
                  <Badge variant={statusVariant(row.reviewState)}>{row.reviewState}</Badge>
                  {row.isRemoteFit ? <Badge variant="info">Remote</Badge> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{row.nextStep}</p>
                <Link
                  className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--border-glow)]"
                  href={`/jobs/${row.job.id}`}
                >
                  Inspect match
                  <ArrowRight className="size-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          description={
            data.jobs.length
              ? "The current confidence or workflow filters are hiding every imported role. Relax the filters to continue scanning."
              : "Run discovery or reset filters to inspect imported roles from enabled sources."
          }
          title={data.jobs.length ? "No discovered jobs match these filters" : "No discovered jobs to inspect"}
        >
          <Link
            className="motion-press inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--border-glow)]"
            href="/discovered-jobs"
          >
            Reset filters
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
