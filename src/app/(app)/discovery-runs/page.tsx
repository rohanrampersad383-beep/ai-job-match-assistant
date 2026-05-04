import Link from "next/link";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { DiscoveryRunCard } from "@/components/discovery/discovery-run-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { getDiscoveryRunsData } from "@/lib/data/discovery";

export default async function DiscoveryRunsPage() {
  const runs = await getDiscoveryRunsData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discovery Runs"
        title="Inspect recent fetch activity"
        description="Track when each source ran, how many jobs were imported or deduplicated, and whether parser or runtime failures need attention."
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

      {runs.length ? (
        <div className="grid gap-4">
          {runs.map((run) => (
            <DiscoveryRunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Run one of the configured sources to create the first discovery history entries."
          title="No discovery runs yet"
        />
      )}
    </div>
  );
}
