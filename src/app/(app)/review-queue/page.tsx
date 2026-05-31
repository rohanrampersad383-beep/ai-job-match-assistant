import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, Sparkles, Target } from "lucide-react";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { ReviewQueueCard } from "@/components/discovery/review-queue-card";
import { ReviewQueueFilters } from "@/components/discovery/review-queue-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { requireUser } from "@/lib/auth/session";
import { getDiscoverySourceOptions, getReviewQueueData } from "@/lib/data/discovery";
import { explainJobMatch } from "@/lib/intelligence/career";
import { cn } from "@/lib/utils";

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value);
  return normalized === "on" || normalized === "true" || normalized === "1";
}

export default async function ReviewQueuePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = asString(params.query);
  const sourceId = asString(params.sourceId);
  const trinidadOnly = params.trinidadOnly ? asBoolean(params.trinidadOnly) : true;
  const remoteOnly = asBoolean(params.remoteOnly);
  const highConfidenceOnly = asBoolean(params.highConfidenceOnly);
  const growthMatchOnly = asBoolean(params.growthMatchOnly);
  const minMatch = params.minMatch ? Number(asString(params.minMatch)) : undefined;
  const recentDays = params.recentDays ? Number(asString(params.recentDays)) : 7;
  const sort = asString(params.sort) ?? "priority";

  const [sources, queue] = await Promise.all([
    getDiscoverySourceOptions(),
    getReviewQueueData(user.id, {
      query,
      sourceId,
      trinidadOnly,
      remoteOnly,
      recentDays
    })
  ]);

  const queueRows = queue.map((job) => ({
    job,
    explanation: explainJobMatch(job),
    matchPercent: job.matches[0]?.matchPercent ?? 0
  }));

  const filteredRows = queueRows.filter((row) => {
    const { explanation, matchPercent } = row;

    if (typeof minMatch === "number" && matchPercent < minMatch) {
      return false;
    }

    if (highConfidenceOnly && explanation.confidence.tier !== "High Confidence") {
      return false;
    }

    if (growthMatchOnly && !explanation.confidence.badges.includes("Growth Match")) {
      return false;
    }

    return true;
  });

  const rows = [...filteredRows].sort((left, right) => {
    const confidenceDelta = right.explanation.confidence.overall - left.explanation.confidence.overall;
    const matchDelta = right.matchPercent - left.matchPercent;
    const dateDelta = (right.job.discoveredAt?.getTime() ?? 0) - (left.job.discoveredAt?.getTime() ?? 0);

    if (sort === "confidence" && confidenceDelta !== 0) {
      return confidenceDelta;
    }

    if (sort === "match" && matchDelta !== 0) {
      return matchDelta;
    }

    if (sort === "date" && dateDelta !== 0) {
      return dateDelta;
    }

    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    if (matchDelta !== 0) {
      return matchDelta;
    }

    return dateDelta;
  });
  const highConfidenceCount = queueRows.filter((row) => row.explanation.confidence.tier === "High Confidence").length;
  const remoteCount = queueRows.filter((row) => row.job.isRemoteFriendly || row.job.workMode === "REMOTE").length;
  const savedCount = queueRows.filter((row) => row.job.savedBy.length).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="motion-ambient-surface relative overflow-hidden border-[var(--border-glow)] bg-[radial-gradient(circle_at_86%_12%,rgba(139,92,246,0.2),transparent_30%),radial-gradient(circle_at_16%_10%,rgba(34,211,238,0.12),transparent_28%),rgba(10,15,24,0.9)] p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase text-[var(--accent-cyan)]">
            <BrainCircuit className="size-4" />
            AI review queue
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
            Triage high-signal opportunities with confidence.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-strong)]">
            MatchIQ surfaces newly discovered roles that need a decision, explains the strongest fit signals, and keeps every apply step manual and intentional.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <DiscoveryActionForm
              action={runAllDiscoverySourcesFeedbackAction}
              label="Run discovery now"
              pendingLabel="Running discovery..."
            />
            <Link
              className="motion-press inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-white/18 bg-white/8 px-4.5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]"
              href="/sources"
            >
              Sources
            </Link>
          </div>
        </Card>

        <Card className="motion-depth-strong grid gap-4 bg-[rgba(11,16,24,0.86)] p-5">
          {[
            { label: "Queued", value: queue.length, icon: Clock3, tone: "text-[var(--accent-cyan)]" },
            { label: "High confidence", value: highConfidenceCount, icon: CheckCircle2, tone: "text-[var(--success)]" },
            { label: "Remote fit", value: remoteCount, icon: Sparkles, tone: "text-[var(--info)]" },
            { label: "Saved", value: savedCount, icon: Target, tone: "text-[var(--warning)]" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="interactive-card flex items-center justify-between rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">{item.label}</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-white">{item.value}</p>
                </div>
                <span className={cn("grid size-10 place-items-center rounded-[var(--radius-md)] bg-white/6", item.tone)}>
                  <Icon className="size-5" />
                </span>
              </div>
            );
          })}
        </Card>
      </section>

      <ReviewQueueFilters
        defaults={{
          query,
          sourceId,
          trinidadOnly,
          remoteOnly,
          highConfidenceOnly,
          growthMatchOnly,
          minMatch,
          recentDays,
          sort
        }}
        sources={sources}
      />

      {rows.length ? <ReviewDecisionMatrix rows={rows.slice(0, 6)} sort={sort} /> : null}

      {rows.length ? (
        <div className="motion-signal-surface flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="discovery">{rows.length} visible</Badge>
            {highConfidenceOnly ? <Badge variant="success">High confidence</Badge> : null}
            {growthMatchOnly ? <Badge variant="info">Growth match</Badge> : null}
            {remoteOnly ? <Badge variant="info">Remote friendly</Badge> : null}
          </div>
          <p className="text-sm text-[var(--muted)]">Sorted by {sort === "priority" ? "AI priority" : sort}</p>
        </div>
      ) : null}

      {rows.length ? (
        <div className="motion-stagger grid gap-4">
          {rows.map((row) => (
            <ReviewQueueCard key={row.job.id} job={row.job} />
          ))}
        </div>
      ) : (
        <EmptyState
          description={
            queue.length
              ? "The current smart filters are hiding all queued roles. Relax confidence, match score, source, or freshness filters to continue reviewing."
              : "Run discovery from the Sources page or relax the review filters to see more jobs."
          }
          title={queue.length ? "No jobs match the current review filters" : "No jobs currently need review"}
        >
          <Link
            className="motion-press inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--border-glow)]"
            href="/review-queue"
          >
            Reset filters
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

function ReviewDecisionMatrix({
  rows,
  sort
}: {
  rows: Array<{
    job: Awaited<ReturnType<typeof getReviewQueueData>>[number];
    explanation: ReturnType<typeof explainJobMatch>;
    matchPercent: number;
  }>;
  sort: string;
}) {
  return (
    <Card className="motion-signal-surface overflow-hidden border-[var(--border)] bg-[rgba(11,16,24,0.88)] p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Target className="size-4 text-[var(--accent-cyan)]" />
            Decision matrix
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Table-style scan of the highest-priority queued roles before opening each full review card.
          </p>
        </div>
        <Badge variant="neutral">Sorted by {sort === "priority" ? "AI priority" : sort}</Badge>
      </div>

      <div className="hidden min-w-0 overflow-x-auto lg:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3 font-semibold">Opportunity</th>
              <th className="px-4 py-3 font-semibold">Match</th>
              <th className="px-4 py-3 font-semibold">Confidence</th>
              <th className="px-4 py-3 font-semibold">Signals</th>
              <th className="px-4 py-3 font-semibold">Next action</th>
              <th className="px-5 py-3 text-right font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <tr key={row.job.id} className="transition hover:bg-white/[0.035]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{row.job.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{row.job.company} - {row.job.location}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={row.matchPercent >= 80 ? "matchHigh" : row.matchPercent >= 60 ? "matchMedium" : "matchLow"}>
                    {row.matchPercent}%
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="w-32">
                    <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{row.explanation.confidence.tier}</span>
                      <span>{row.explanation.confidence.overall}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${row.explanation.confidence.overall}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex max-w-xs flex-wrap gap-1.5">
                    {row.explanation.confidence.badges.slice(0, 2).map((badge) => (
                      <Badge key={badge} className="px-2 py-1 text-[10px]" variant={badge === "Skill Gap" ? "warning" : "discovery"}>
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="max-w-sm px-4 py-4 text-xs leading-5 text-[var(--muted-strong)]">
                  {row.explanation.nextStep}
                </td>
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

      <div className="grid gap-3 p-4 lg:hidden">
        {rows.map((row) => (
          <Link
            key={row.job.id}
            className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--border-glow)]"
            href={`/jobs/${row.job.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{row.job.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{row.job.company}</p>
              </div>
              <Badge variant={row.matchPercent >= 80 ? "matchHigh" : row.matchPercent >= 60 ? "matchMedium" : "matchLow"}>
                {row.matchPercent}%
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">{row.explanation.nextStep}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
