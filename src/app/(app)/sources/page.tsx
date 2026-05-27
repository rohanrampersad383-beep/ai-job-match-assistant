import { ExternalLink } from "lucide-react";

import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { SourceForm } from "@/components/discovery/source-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  runAllDiscoverySourcesFeedbackAction,
  runDiscoverySourceFeedbackAction,
  saveDiscoverySourceAction,
  toggleDiscoverySourceAction
} from "@/lib/actions/discovery";
import { getSourcesData } from "@/lib/data/discovery";
import { formatDate } from "@/lib/utils";

function healthVariant(status: string) {
  switch (status) {
    case "HEALTHY":
      return "success";
    case "ERROR":
      return "danger";
    case "DEGRADED":
      return "warning";
    default:
      return "neutral";
  }
}

function qualityBadges(source: { defaultTags: string[]; regionTags: string[]; enabled: boolean; healthStatus: string }) {
  const tags = new Set([...source.defaultTags, ...source.regionTags]);
  const badges = [];

  if (tags.has("high-quality")) badges.push({ label: "High Quality", variant: "success" as const });
  if (tags.has("remote-friendly")) badges.push({ label: "Remote Friendly", variant: "discovery" as const });
  if (tags.has("startup-source")) badges.push({ label: "Startup Source", variant: "info" as const });
  if (tags.has("trinidad-and-tobago") || tags.has("caribbean")) badges.push({ label: "Regional Source", variant: "success" as const });
  if (!source.enabled || tags.has("needs-review") || source.healthStatus === "UNKNOWN") {
    badges.push({ label: "Needs Review", variant: "warning" as const });
  }

  return badges;
}

export default async function SourcesPage() {
  const sources = await getSourcesData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sources"
        title="Manage legal discovery sources"
        description="Enable only lawful public sources, inspect their health, and run them manually when you need a local fallback to scheduled discovery."
        actions={
          <DiscoveryActionForm
            action={runAllDiscoverySourcesFeedbackAction}
            label="Run enabled sources now"
            pendingLabel="Running discovery..."
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SourceForm action={saveDiscoverySourceAction} />

        <Card className="bg-[var(--surface)]">
          <CardTitle>Safe discovery policy</CardTitle>
          <CardDescription className="mt-2">
            This platform is designed for legal job discovery only. LinkedIn automation, auto-apply behavior, and risky scraping are intentionally excluded.
          </CardDescription>
          <div className="mt-6 grid gap-4 text-sm text-[var(--secondary)]">
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              Prefer RSS feeds, public APIs, and official company careers pages that are publicly accessible.
            </div>
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              Keep source-specific legal notes and parser constraints documented so risky sources can be disabled quickly.
            </div>
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              Every discovered job keeps the original source name and URL. Final submission always stays manual.
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        {sources.map((source) => {
          const lastRun = source.runs[0];

          return (
            <Card key={source.id} className="motion-signal-surface bg-[var(--surface)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{source.name}</CardTitle>
                    <Badge variant="info">{source.sourceType}</Badge>
                    <Badge variant="discovery">{source.fetchStrategy}</Badge>
                  </div>
                  <CardDescription className="mt-2 break-all">
                    {source.baseUrl}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={source.enabled ? "success" : "warning"}>
                    {source.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant={healthVariant(source.healthStatus)}>{source.healthStatus}</Badge>
                  <Badge>{source.parserKey}</Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {qualityBadges(source).map((badge) => (
                  <Badge key={`${source.id}-${badge.label}`} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                  <p className="text-xs uppercase text-[var(--muted)]">Last run</p>
                  <p className="mt-1 text-sm text-[var(--secondary)]">{formatDate(source.lastRunAt)}</p>
                </div>
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                  <p className="text-xs uppercase text-[var(--muted)]">Last success</p>
                  <p className="mt-1 text-sm text-[var(--secondary)]">{formatDate(source.lastSuccessAt)}</p>
                </div>
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                  <p className="text-xs uppercase text-[var(--muted)]">Normalized jobs</p>
                  <p className="mt-1 text-sm text-[var(--secondary)]">{source._count.normalizedJobs}</p>
                </div>
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                  <p className="text-xs uppercase text-[var(--muted)]">Recorded errors</p>
                  <p className="mt-1 text-sm text-[var(--secondary)]">{source._count.errors}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
                <p className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.025)] px-4 py-4 text-sm leading-7 text-[var(--secondary)]">
                  {source.legalNotes}
                </p>
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                  <p className="text-xs uppercase text-[var(--muted)]">Latest source signal</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                    {source.lastMessage ?? "No run history yet. Use the manual run action to validate this adapter."}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {source.defaultTags.map((tag) => (
                  <Badge key={`${source.id}-default-${tag}`}>{tag}</Badge>
                ))}
                {source.regionTags.map((tag) => (
                  <Badge key={`${source.id}-region-${tag}`} variant="success">
                    {tag}
                  </Badge>
                ))}
              </div>

              {lastRun ? (
                <div className="mt-6 rounded-[1.25rem] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--secondary)]">
                  Last run summary: found {lastRun.jobsFound}, imported {lastRun.jobsImported}, duplicates{" "}
                  {lastRun.duplicatesSkipped}, parsing failures {lastRun.parsingFailures}, runtime errors{" "}
                  {lastRun.runtimeErrors}.
                </div>
              ) : null}

              {source.logs.length ? (
                <div className="mt-4 grid gap-2">
                  {source.logs.map((log) => (
                    <div key={log.id} className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--secondary)]">
                      {log.message}
                    </div>
                  ))}
                </div>
              ) : null}

              {source.errors.length ? (
                <div className="mt-4 grid gap-2">
                  {source.errors.map((error) => (
                    <div key={error.id} className="rounded-2xl bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
                      {error.message}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-start gap-3">
                <DiscoveryActionForm
                  action={runDiscoverySourceFeedbackAction}
                  hiddenFields={{ sourceId: source.id }}
                  label="Run source now"
                  pendingLabel="Running source..."
                  size="sm"
                  variant="secondary"
                />
                <form action={toggleDiscoverySourceAction}>
                  <input name="sourceId" type="hidden" value={source.id} />
                  <SubmitButton pendingLabel={source.enabled ? "Disabling..." : "Enabling..."} size="sm" type="submit" variant="secondary">
                    {source.enabled ? "Disable" : "Enable"}
                  </SubmitButton>
                </form>
                <a
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                  href={source.publicUrl ?? source.baseUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open public source
                  <ExternalLink className="size-4" />
                </a>
              </div>

              <details className="mt-6 rounded-[1.25rem] bg-[var(--surface-muted)] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--secondary)]">
                  Edit configuration
                </summary>
                <div className="mt-4">
                  <SourceForm
                    action={saveDiscoverySourceAction}
                    defaults={source}
                    description="Update parser settings, legal notes, and fetch config for this source."
                    submitLabel="Update source"
                    title={`Edit ${source.name}`}
                  />
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
