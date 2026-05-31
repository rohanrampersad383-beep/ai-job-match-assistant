import Link from "next/link";
import { AlertTriangle, CheckCircle2, DatabaseZap, Layers3, RotateCw } from "lucide-react";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { DiscoveryRunCard } from "@/components/discovery/discovery-run-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { getDiscoveryRunsData } from "@/lib/data/discovery";
import { cn } from "@/lib/utils";

export default async function DiscoveryRunsPage() {
  const runs = await getDiscoveryRunsData();
  const summary = {
    total: runs.length,
    successful: runs.filter((run) => run.status === "SUCCESS").length,
    failed: runs.filter((run) => run.status === "FAILED").length,
    found: runs.reduce((sum, run) => sum + run.jobsFound, 0),
    imported: runs.reduce((sum, run) => sum + run.jobsImported, 0),
    issues: runs.reduce((sum, run) => sum + run.parsingFailures + run.runtimeErrors, 0)
  };

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
              className="inline-flex cursor-pointer rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface-raised)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary)]"
              href="/sources"
            >
              Sources
            </Link>
          </>
        }
      />

      {runs.length ? <RunResultsSummary summary={summary} /> : null}

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

function RunResultsSummary({
  summary
}: {
  summary: {
    total: number;
    successful: number;
    failed: number;
    found: number;
    imported: number;
    issues: number;
  };
}) {
  const importRate = summary.found ? Math.round((summary.imported / summary.found) * 100) : 0;
  const items = [
    { label: "Runs", value: summary.total, hint: "Recent history", icon: RotateCw, tone: "text-[var(--accent-cyan)]" },
    { label: "Successful", value: summary.successful, hint: "Clean completions", icon: CheckCircle2, tone: "text-[var(--success)]" },
    { label: "Imported", value: summary.imported, hint: `${importRate}% of found jobs`, icon: DatabaseZap, tone: "text-[var(--primary-soft)]" },
    { label: "Failures", value: summary.failed, hint: "Run-level errors", icon: AlertTriangle, tone: summary.failed ? "text-[var(--warning)]" : "text-[var(--muted)]" },
    { label: "Issues", value: summary.issues, hint: "Parser/runtime signals", icon: Layers3, tone: summary.issues ? "text-[var(--warning)]" : "text-[var(--muted)]" }
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
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
  );
}
