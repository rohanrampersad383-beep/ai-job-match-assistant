import { notFound } from "next/navigation";
import { BrainCircuit, ExternalLink, Target, TrendingUp } from "lucide-react";

import { GeneratedDocuments } from "@/components/applications/generated-documents";
import { JobActions } from "@/components/jobs/job-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getJobDetailData } from "@/lib/data/dashboard";
import { explainJobMatch } from "@/lib/intelligence/career";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";

export default async function JobDetailPage({
  params
}: {
  params: Promise<{ jobId: string }>;
}) {
  const user = await requireUser();
  const { jobId } = await params;
  const job = await getJobDetailData(user.id, jobId);

  if (!job) {
    notFound();
  }

  const match = job.matches[0];
  const explanation = explainJobMatch(job);
  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`
      : "Not listed";
  const suggestedKeywords = Array.from(new Set([...(match?.matchedSkills ?? []), ...(match?.missingSkills ?? []), ...job.requiredSkills])).slice(0, 12);

  return (
    <div className="space-y-6">
      <Card className="motion-ambient-surface relative overflow-hidden border-[var(--border-glow)] bg-[radial-gradient(circle_at_85%_10%,rgba(139,92,246,0.2),transparent_30%),radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.12),transparent_28%),rgba(10,15,24,0.9)] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="discovery">{explanation.confidence.tier}</Badge>
              {explanation.confidence.badges.slice(0, 4).map((badge) => (
                <Badge key={badge} variant={badge === "Skill Gap" ? "warning" : "info"}>{badge}</Badge>
              ))}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">{job.title}</h1>
            <p className="mt-3 text-lg font-semibold text-[var(--muted-strong)]">{job.company}</p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-strong)]">
              {explanation.summary}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row xl:flex-col">
            <div className="motion-score-ring min-w-[170px] rounded-[1.5rem] bg-[image:var(--gradient-brand)] px-5 py-5 text-center text-white shadow-[var(--shadow-glow)]">
              <p className="text-xs font-semibold uppercase text-white/78">Match score</p>
              <p className="mt-2 font-display text-5xl font-semibold">{match?.matchPercent ?? 0}%</p>
              <p className="mt-1 text-xs text-white/72">{explanation.confidence.overall}% confidence</p>
            </div>
            <JobActions applicationUrl={job.applicationUrl} jobId={job.id} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="motion-depth-strong bg-[var(--surface)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription className="mt-2">
                {job.company} | {job.location} | {job.workMode ? titleCase(job.workMode) : "Not specified"}
              </CardDescription>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--primary)] px-5 py-4 text-center text-white">
              <p className="text-xs uppercase">Match</p>
              <p className="text-3xl font-semibold">{match?.matchPercent ?? 0}%</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="success">{match?.category?.replaceAll("_", " ") ?? "Awaiting score"}</Badge>
            <Badge>{match?.applyWorthIt ?? "MAYBE"}</Badge>
            <Badge>{job.isDiscoveredAutomatically ? "Auto discovery" : "Manual import"}</Badge>
            <Badge>{job.sourceName}</Badge>
            {job.needsReview ? <Badge variant="warning">Needs review</Badge> : null}
            {job.isTrinidadAndTobago ? <Badge variant="success">Trinidad and Tobago</Badge> : null}
            {job.isCaribbeanFriendlyRemote ? <Badge>Caribbean-friendly remote</Badge> : null}
            {job.savedBy.length ? <Badge variant="warning">Saved</Badge> : null}
            {job.hiddenBy.length ? <Badge variant="danger">Hidden</Badge> : null}
            {job.applications.length ? <Badge variant="success">{job.applications[0].status}</Badge> : null}
          </div>

          <div className="mt-6 grid gap-3 text-sm text-[var(--secondary)]">
            <p>Salary: {salaryLabel}</p>
            <p>Posted: {formatDate(job.postedAt)}</p>
            <p>Discovered: {formatDate(job.discoveredAt)}</p>
            <p>Required experience: {job.requiredYearsExperience ? `${job.requiredYearsExperience}+ years` : "Not specified"}</p>
            <p>Education: {job.educationRequirements ?? "Not specified"}</p>
            <p>Source: {job.sourceName}</p>
            <p>Source URL: {job.sourceReference ?? job.applicationUrl}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">{job.description}</p>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="motion-signal-surface bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.1),transparent_30%),var(--surface)]">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-[var(--accent-cyan)]" />
              <CardTitle>AI fit explanation</CardTitle>
            </div>

            <div className="mt-5 grid gap-3">
              {explanation.strongestAlignment.map((signal) => (
                <div key={signal} className="rounded-[1rem] border border-[var(--success)]/18 bg-[var(--success)]/8 px-4 py-3 text-sm text-[var(--success)]">
                  {signal}
                </div>
              ))}
            </div>

            {explanation.watchouts.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[var(--secondary)]">Watchouts</h3>
                <div className="mt-3 grid gap-2">
                  {explanation.watchouts.map((watchout) => (
                    <div key={watchout} className="rounded-[1rem] border border-[var(--warning)]/20 bg-[var(--warning)]/8 px-4 py-3 text-sm text-[var(--warning)]">
                      {watchout}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
                <Target className="size-4 text-[var(--accent-cyan)]" />
                Recommended next step
              </div>
              <p className="text-sm leading-6 text-[var(--secondary)]">{explanation.nextStep}</p>
            </div>
          </Card>

          <Card className="motion-depth-strong bg-[var(--surface)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-[var(--accent-cyan)]" />
              <CardTitle>Confidence dimensions</CardTitle>
            </div>
            <div className="mt-5 grid gap-4">
              {explanation.confidence.dimensions.map((dimension) => (
                <div key={dimension.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[var(--muted-strong)]">{dimension.label}</span>
                    <span className="text-[var(--foreground)]">{dimension.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="motion-progress-fill h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${dimension.value}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{dimension.rationale}</p>
                </div>
              ))}
            </div>
          </Card>

          <GeneratedDocuments documents={job.generatedDocuments} />
        </div>
      </div>

      <Card className="motion-signal-surface bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Suggested resume keywords</CardTitle>
            <CardDescription className="mt-2">Use these only if they truthfully reflect your experience or portfolio evidence.</CardDescription>
          </div>
          <a
            className="motion-press inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:border-[var(--border-glow)] hover:text-white"
            href={job.applicationUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open official role
            <ExternalLink className="size-4" />
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedKeywords.map((skill) => (
            <Badge key={skill} variant={(match?.missingSkills ?? []).includes(skill) ? "warning" : "discovery"}>
              {skill}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
