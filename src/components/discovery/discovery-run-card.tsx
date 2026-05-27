import { AlertTriangle, CheckCircle2, Clock3, DatabaseZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

function statusVariant(status: string) {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "danger";
    case "PARTIAL":
      return "warning";
    default:
      return "neutral";
  }
}

export function DiscoveryRunCard({
  run
}: {
  run: {
    id: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    jobsFound: number;
    jobsImported: number;
    duplicatesSkipped: number;
    parsingFailures: number;
    runtimeErrors: number;
    source: {
      name: string;
      sourceType: string;
    };
    logs: Array<{
      id: string;
      message: string;
      createdAt: Date;
    }>;
    errors: Array<{
      id: string;
      message: string;
      createdAt: Date;
    }>;
  };
}) {
  const importedRate = run.jobsFound ? Math.round((run.jobsImported / run.jobsFound) * 100) : 0;
  const issueCount = run.parsingFailures + run.runtimeErrors;
  const statusIcon = run.status === "SUCCESS" ? CheckCircle2 : run.status === "FAILED" ? AlertTriangle : Clock3;
  const StatusIcon = statusIcon;

  return (
    <Card className="interactive-card motion-signal-surface bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.1),transparent_28%),var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="discovery">{run.source.sourceType}</Badge>
            <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
            {issueCount ? <Badge variant="warning">{issueCount} issues</Badge> : <Badge variant="success">Clean run</Badge>}
          </div>
          <CardTitle className="text-[1.45rem]">{run.source.name}</CardTitle>
          <CardDescription className="mt-2">
            {run.source.sourceType} | Started {formatDate(run.startedAt)}
            {run.finishedAt ? ` | Finished ${formatDate(run.finishedAt)}` : ""}
          </CardDescription>
        </div>
        <div className="grid size-12 place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent-cyan)]">
          <StatusIcon className="size-5" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_repeat(4,minmax(0,0.7fr))]">
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
            <DatabaseZap className="size-4 text-[var(--accent-cyan)]" />
            Import health
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div className="motion-progress-fill h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${importedRate}%` }} />
          </div>
          <p className="mt-2 text-sm text-[var(--secondary)]">{importedRate}% of found jobs imported</p>
        </div>
        {[
          ["Found", run.jobsFound],
          ["Imported", run.jobsImported],
          ["Duplicates", run.duplicatesSkipped],
          ["Failures", run.parsingFailures],
          ["Runtime errors", run.runtimeErrors]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      {run.logs.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--secondary)]">Latest logs</h3>
          <div className="mt-3 grid gap-2">
            {run.logs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--secondary)]">
                {log.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {run.errors.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--secondary)]">Latest errors</h3>
          <div className="mt-3 grid gap-2">
            {run.errors.map((error) => (
              <div key={error.id} className="rounded-2xl bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
                {error.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
