import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { hideJobAction, markAppliedAction, markReviewedAction, saveJobAction } from "@/lib/actions/jobs";
import { formatDate } from "@/lib/utils";
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

export function ReviewQueueCard({
  job
}: {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    sourceName: string;
    applicationUrl: string;
    discoveredAt: Date | null;
    isTrinidadAndTobago: boolean;
    isCaribbeanFriendlyRemote: boolean;
    isRemoteFriendly: boolean;
    needsReview: boolean;
    matches: Array<{
      matchPercent: number;
      applyWorthIt: string;
      category: string;
      reasons: unknown;
    }>;
    savedBy: Array<unknown>;
    applications: Array<{
      status: string;
    }>;
  };
}) {
  const match = job.matches[0];
  const reasons = Array.isArray(match?.reasons) ? (match?.reasons as ScoreReason[]) : [];

  return (
    <Card className="interactive-card bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="discovery">{job.sourceName}</Badge>
            <Badge variant={matchVariant(match?.category)}>{match?.category?.replaceAll("_", " ") ?? "Awaiting score"}</Badge>
            {job.needsReview ? <Badge variant="warning">Needs review</Badge> : null}
            {job.isTrinidadAndTobago ? <Badge variant="success">Trinidad and Tobago</Badge> : null}
            {job.isRemoteFriendly ? <Badge variant="info">Remote-friendly</Badge> : null}
            {job.isCaribbeanFriendlyRemote ? <Badge variant="info">Caribbean-friendly remote</Badge> : null}
            {job.savedBy.length ? <Badge variant="warning">Saved</Badge> : null}
            {job.applications.length ? <Badge variant="success">{job.applications[0].status}</Badge> : null}
          </div>
          <CardTitle className="text-[1.55rem] leading-tight">
            <Link className="transition hover:text-[var(--primary)]" href={`/jobs/${job.id}`}>
              {job.title}
            </Link>
          </CardTitle>
          <p className="text-base font-semibold text-[var(--secondary)]">{job.company}</p>
          <CardDescription>
            {job.location} | Discovered {formatDate(job.discoveredAt)}
          </CardDescription>
        </div>
        <div className="min-w-[126px] rounded-[1.35rem] bg-[image:var(--gradient-brand)] px-4 py-4 text-right text-[var(--primary-foreground)] shadow-[var(--shadow-glow)]">
          <p className="text-xs uppercase">Match</p>
          <p className="mt-2 text-4xl font-semibold ">{match?.matchPercent ?? 0}%</p>
          <p className="mt-1 text-xs text-white/72">{match?.applyWorthIt ?? "MAYBE"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="neutral">{match?.applyWorthIt ?? "MAYBE"}</Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {reasons.slice(0, 3).map((reason) => (
          <div
            key={reason.label}
            className={`rounded-2xl px-4 py-3 text-sm ${
              reason.tone === "positive"
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : reason.tone === "warning"
                  ? "bg-[var(--accent)]/18 text-[var(--warning)]"
                  : "bg-[var(--surface-muted)] text-[var(--secondary)]"
            }`}
          >
            {reason.label}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={saveJobAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="secondary">
            Save
          </SubmitButton>
        </form>
        <form action={hideJobAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Hiding..." size="sm" type="submit" variant="secondary">
            Hide
          </SubmitButton>
        </form>
        <form action={markReviewedAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Updating..." size="sm" type="submit" variant="secondary">
            Mark reviewed
          </SubmitButton>
        </form>
        <form action={markAppliedAction}>
          <input name="jobId" type="hidden" value={job.id} />
          <SubmitButton pendingLabel="Updating..." size="sm" type="submit" variant="secondary">
            Mark applied
          </SubmitButton>
        </form>
        <a
          className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--secondary)]"
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
