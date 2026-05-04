import Link from "next/link";

import { hideJobAction, markReviewedAction, saveJobAction } from "@/lib/actions/jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ScoreReason } from "@/types";

function matchVariant(category?: string) {
  switch (category) {
    case "HIGH_MATCH":
      return "matchHigh";
    case "MEDIUM_MATCH":
      return "matchMedium";
    default:
      return "matchLow";
  }
}

export function JobCard({
  job
}: {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    workMode: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    postedAt: Date | null;
    discoveredAt: Date | null;
    description: string;
    sourceName: string;
    applicationUrl: string;
    isDiscoveredAutomatically: boolean;
    needsReview: boolean;
    isTrinidadAndTobago: boolean;
    isCaribbeanFriendlyRemote: boolean;
    matches: Array<{
      matchPercent: number;
      category: string;
      applyWorthIt: string;
      reasons: unknown;
      reviewedAt: Date | null;
    }>;
    savedBy: Array<unknown>;
    applications: Array<{
      status: string;
    }>;
  };
}) {
  const match = job.matches[0];
  const reasons = Array.isArray(match?.reasons) ? (match.reasons as ScoreReason[]) : [];
  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`
      : "Salary not listed";

  return (
    <Card className="interactive-card h-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,252,0.94)_100%)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="discovery">{job.sourceName}</Badge>
            <Badge variant={job.isDiscoveredAutomatically ? "info" : "neutral"}>
              {job.isDiscoveredAutomatically ? "Discovered" : "Manual"}
            </Badge>
            {job.needsReview ? <Badge variant="warning">Needs review</Badge> : null}
            {job.isTrinidadAndTobago ? <Badge variant="success">Trinidad and Tobago</Badge> : null}
            {job.isCaribbeanFriendlyRemote ? <Badge variant="info">Caribbean-friendly remote</Badge> : null}
          </div>

          <CardTitle className="text-[1.72rem] leading-tight">
            <Link href={`/jobs/${job.id}`} className="transition hover:text-[var(--primary)]">
              {job.title}
            </Link>
          </CardTitle>
          <p className="mt-2 text-base font-semibold text-[var(--secondary)]">{job.company}</p>
          <CardDescription className="mt-2">
            {job.location} | {job.workMode ?? "Work mode not specified"} | Posted {formatDate(job.postedAt)}
            {job.discoveredAt ? ` | Discovered ${formatDate(job.discoveredAt)}` : ""}
          </CardDescription>
        </div>

        <div className="min-w-[136px] rounded-[1.45rem] bg-[linear-gradient(180deg,#10384d_0%,#175978_100%)] px-4 py-4 text-center text-white shadow-[var(--shadow-strong)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Match score</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{match?.matchPercent ?? 0}%</p>
          <p className="mt-1 text-xs text-white/72">{match?.applyWorthIt ?? "MAYBE"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant={matchVariant(match?.category)}>{match?.category?.replaceAll("_", " ") ?? "Awaiting score"}</Badge>
        {job.savedBy.length ? <Badge variant="warning">Saved</Badge> : null}
        {job.applications.length ? <Badge variant="success">{job.applications[0].status}</Badge> : null}
        <Badge variant="neutral">{salaryLabel}</Badge>
        <Badge variant="neutral">{match?.reviewedAt ? "Reviewed" : "Unreviewed"}</Badge>
      </div>

      <p className="mt-5 text-sm leading-7 text-[var(--muted-strong)]">
        {job.description.slice(0, 240)}
        {job.description.length > 240 ? "..." : ""}
      </p>

      {reasons.length ? (
        <div className="mt-5 grid gap-2 lg:grid-cols-2">
          {reasons.slice(0, 2).map((reason) => (
            <div
              key={reason.label}
              className={`rounded-[1rem] px-4 py-3 text-sm ${
                reason.tone === "positive"
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : reason.tone === "warning"
                    ? "bg-[var(--accent)]/16 text-[#8a6100]"
                    : "bg-[var(--muted-surface)] text-[var(--secondary)]"
              }`}
            >
              {reason.label}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={saveJobAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="secondary">
            Save
          </SubmitButton>
        </form>
        <form action={markReviewedAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Updating..." size="sm" type="submit" variant="secondary">
            Mark reviewed
          </SubmitButton>
        </form>
        <form action={hideJobAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Hiding..." size="sm" type="submit" variant="secondary">
            Hide
          </SubmitButton>
        </form>
        <Link
          className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--border)] bg-white/92 px-4 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white"
          href={`/jobs/${job.id}`}
        >
          View details
        </Link>
        <a
          className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--border)] bg-white/92 px-4 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white"
          href={job.applicationUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open source link
        </a>
      </div>
    </Card>
  );
}
