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
  return (
    <Card className="interactive-card bg-white/88 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="discovery">{run.source.sourceType}</Badge>
            <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
          </div>
          <CardTitle className="text-[1.45rem]">{run.source.name}</CardTitle>
          <CardDescription className="mt-2">
            {run.source.sourceType} | Started {formatDate(run.startedAt)}
            {run.finishedAt ? ` | Finished ${formatDate(run.finishedAt)}` : ""}
          </CardDescription>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Found</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{run.jobsFound}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Imported</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{run.jobsImported}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Duplicates</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{run.duplicatesSkipped}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Parsing failures</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{run.parsingFailures}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Runtime errors</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{run.runtimeErrors}</p>
        </div>
      </div>

      {run.logs.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--secondary)]">Latest logs</h3>
          <div className="mt-3 grid gap-2">
            {run.logs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white/75 px-4 py-3 text-sm text-[var(--secondary)]">
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
