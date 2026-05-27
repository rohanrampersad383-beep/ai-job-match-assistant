import Link from "next/link";
import { BrainCircuit, ExternalLink, ShieldCheck, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { hideJobAction, markAppliedAction, markReviewedAction, saveJobAction } from "@/lib/actions/jobs";
import { explainJobMatch } from "@/lib/intelligence/career";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";

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
    workMode: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    description: string;
    requiredSkills: string[];
    preferredSkills: string[];
    seniorityLevel: string | null;
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
      matchedSkills: string[];
      missingSkills: string[];
    }>;
    savedBy: Array<unknown>;
    applications: Array<{
      status: string;
    }>;
  };
}) {
  const match = job.matches[0];
  const explanation = explainJobMatch(job);
  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`
      : "Salary not listed";

  return (
    <Card className="interactive-card motion-glow-hover bg-[radial-gradient(circle_at_100%_0%,rgba(47,107,255,0.11),transparent_30%),var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="discovery">{job.sourceName}</Badge>
            <Badge variant={matchVariant(match?.category)}>{match?.category?.replaceAll("_", " ") ?? "Awaiting score"}</Badge>
            {explanation.confidence.badges.slice(0, 3).map((badge) => (
              <Badge key={badge} variant={badge === "Skill Gap" ? "warning" : "discovery"}>{badge}</Badge>
            ))}
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
            {job.location} | {job.workMode ? titleCase(job.workMode) : "Work mode not specified"} | Discovered {formatDate(job.discoveredAt)}
          </CardDescription>
        </div>
        <div className="min-w-[126px] rounded-[1.35rem] bg-[image:var(--gradient-brand)] px-4 py-4 text-right text-[var(--primary-foreground)] shadow-[var(--shadow-glow)]">
          <p className="text-xs uppercase">Match</p>
          <p className="mt-2 text-4xl font-semibold ">{match?.matchPercent ?? 0}%</p>
          <p className="mt-1 text-xs text-white/72">{explanation.confidence.tier}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="neutral">{match?.applyWorthIt ?? "MAYBE"}</Badge>
        <Badge variant="neutral">{salaryLabel}</Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="rounded-[1.15rem] border border-[var(--border-glow)] bg-[rgba(47,107,255,0.08)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BrainCircuit className="size-4 text-[var(--accent-cyan)]" />
            AI review summary
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{explanation.summary}</p>
          <div className="mt-4 grid gap-2">
            {explanation.strongestAlignment.slice(0, 2).map((signal) => (
              <div key={signal} className="rounded-[var(--radius-md)] bg-[var(--success)]/8 px-3 py-2 text-sm text-[var(--success)]">
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
              <ShieldCheck className="size-4 text-[var(--accent-cyan)]" />
              Confidence
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${explanation.confidence.overall}%` }} />
            </div>
            <p className="mt-2 text-sm text-[var(--secondary)]">{explanation.confidence.overall}% overall confidence</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
              <Target className="size-4 text-[var(--warning)]" />
              Next action
            </div>
            <p className="text-sm leading-6 text-[var(--secondary)]">{explanation.nextStep}</p>
          </div>
          {explanation.watchouts[0] ? (
            <div className="rounded-[1rem] border border-[var(--warning)]/20 bg-[var(--warning)]/8 p-4 text-sm leading-6 text-[var(--warning)]">
              {explanation.watchouts[0]}
            </div>
          ) : null}
        </div>
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
          className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:border-[var(--border-glow)] hover:text-white"
          href={job.applicationUrl}
          rel="noreferrer"
          target="_blank"
        >
          <Sparkles className="size-4" />
          Open source link
          <ExternalLink className="size-4" />
        </a>
      </div>
    </Card>
  );
}
