import Link from "next/link";

import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { PageHeader } from "@/components/layout/page-header";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import type { DashboardFilters as DashboardFilterInput } from "@/types";

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value);
  return normalized === "on" || normalized === "true" || normalized === "1";
}

function buildFilters(searchParams: Record<string, string | string[] | undefined>): DashboardFilterInput {
  const needsReviewOnly = asBoolean(searchParams.needsReviewOnly);

  return {
    query: asString(searchParams.query),
    view: needsReviewOnly
      ? "needs-review"
      : ((asString(searchParams.view) as DashboardFilterInput["view"]) ?? "all"),
    workMode: (asString(searchParams.workMode) as DashboardFilterInput["workMode"]) ?? "ALL",
    seniority: (asString(searchParams.seniority) as DashboardFilterInput["seniority"]) ?? "ALL",
    minMatch: searchParams.minMatch ? Number(asString(searchParams.minMatch)) : undefined,
    sourceId: asString(searchParams.sourceId) || undefined,
    recentDays: searchParams.recentDays ? Number(asString(searchParams.recentDays)) : undefined,
    discoveredOnly: asBoolean(searchParams.discoveredOnly),
    trinidadOnly: asBoolean(searchParams.trinidadOnly),
    remoteFriendlyOnly: asBoolean(searchParams.remoteFriendlyOnly),
    page: searchParams.page ? Number(asString(searchParams.page)) : 1
  };
}

function buildPageHref(filters: DashboardFilterInput, page: number) {
  const params = new URLSearchParams();

  if (filters.query) params.set("query", filters.query);
  if (filters.view && filters.view !== "all") params.set("view", filters.view);
  if (filters.workMode && filters.workMode !== "ALL") params.set("workMode", filters.workMode);
  if (filters.seniority && filters.seniority !== "ALL") params.set("seniority", filters.seniority);
  if (typeof filters.minMatch === "number") params.set("minMatch", String(filters.minMatch));
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (typeof filters.recentDays === "number") params.set("recentDays", String(filters.recentDays));
  if (filters.discoveredOnly) params.set("discoveredOnly", "1");
  if (filters.trinidadOnly) params.set("trinidadOnly", "1");
  if (filters.remoteFriendlyOnly) params.set("remoteFriendlyOnly", "1");
  params.set("page", String(page));

  return `/dashboard?${params.toString()}`;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = buildFilters(params);
  const data = await getDashboardData(user.id, filters);
  const jobs = [...data.jobs].sort(
    (left, right) => (right.matches[0]?.matchPercent ?? 0) - (left.matches[0]?.matchPercent ?? 0)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Ranked opportunities"
        description="Review newly discovered and manually added opportunities in one place, prioritize high-signal matches, and keep every application step fully manual."
        actions={
          <>
            <DiscoveryActionForm
              action={runAllDiscoverySourcesFeedbackAction}
              className="min-w-[250px]"
              label="Run discovery now"
              pendingLabel="Running discovery..."
            />
            <Link
              className="inline-flex items-center justify-center rounded-[1rem] border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface-raised)]/10"
              href="/review-queue"
            >
              Review queue
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-[1rem] border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface-raised)]/10"
              href="/sources"
            >
              Sources
            </Link>
          </>
        }
      />

      <StatsStrip
        stats={[
          { label: "New jobs", value: data.summary.newJobs, hint: "Discovered in the last 7 days", tone: "primary" },
          { label: "Trinidad jobs", value: data.summary.trinidadJobs, hint: "Normalized to Trinidad and Tobago", tone: "success" },
          { label: "Remote jobs", value: data.summary.remoteJobs, hint: "Remote or remote-friendly", tone: "info" },
          { label: "High match", value: data.summary.highMatchJobs, hint: "80% fit or above", tone: "warning" },
          { label: "Needs review", value: data.summary.needsReview, hint: "Still waiting for triage", tone: "neutral" }
        ]}
      />

      <DashboardFilters
        defaults={{
          query: filters.query,
          view: filters.view,
          workMode: filters.workMode,
          seniority: filters.seniority,
          minMatch: filters.minMatch,
          sourceId: filters.sourceId,
          recentDays: filters.recentDays,
          discoveredOnly: filters.discoveredOnly,
          trinidadOnly: filters.trinidadOnly,
          remoteFriendlyOnly: filters.remoteFriendlyOnly
        }}
        sources={data.sources}
      />

      {jobs.length ? (
        <div className="grid gap-5 2xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Run discovery from the Sources page or keep manual import as a fallback to populate the ranking engine."
          title="No jobs match the current filter"
        />
      )}

      <div className="flex items-center justify-between rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--secondary)]">
        <span>
          Page {data.page} of {data.totalPages}
        </span>
        <div className="flex gap-3">
          {data.page > 1 ? (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-raised)]"
              href={buildPageHref(filters, data.page - 1)}
            >
              Previous
            </Link>
          ) : null}
          {data.page < data.totalPages ? (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-raised)]"
              href={buildPageHref(filters, data.page + 1)}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
