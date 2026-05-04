import Link from "next/link";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { ReviewQueueCard } from "@/components/discovery/review-queue-card";
import { ReviewQueueFilters } from "@/components/discovery/review-queue-filters";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { requireUser } from "@/lib/auth/session";
import { getDiscoverySourceOptions, getReviewQueueData } from "@/lib/data/discovery";

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
  const recentDays = params.recentDays ? Number(asString(params.recentDays)) : 7;

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

  const jobs = [...queue].sort((left, right) => {
    const matchDelta = (right.matches[0]?.matchPercent ?? 0) - (left.matches[0]?.matchPercent ?? 0);
    if (matchDelta !== 0) {
      return matchDelta;
    }

    return (right.discoveredAt?.getTime() ?? 0) - (left.discoveredAt?.getTime() ?? 0);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review Queue"
        title="Triage new discovery results"
        description="Focus on newly discovered roles, inspect why they matched, and decide whether to save, hide, review, or apply manually."
        actions={
          <>
            <DiscoveryActionForm
              action={runAllDiscoverySourcesFeedbackAction}
              label="Run discovery now"
              pendingLabel="Running discovery..."
            />
            <Link
              className="inline-flex cursor-pointer rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary)]"
              href="/sources"
            >
              Sources
            </Link>
          </>
        }
      />

      <ReviewQueueFilters
        defaults={{
          query,
          sourceId,
          trinidadOnly,
          remoteOnly,
          recentDays
        }}
        sources={sources}
      />

      {jobs.length ? (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <ReviewQueueCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Run discovery from the Sources page or relax the review filters to see more jobs."
          title="No jobs currently need review"
        />
      )}
    </div>
  );
}
