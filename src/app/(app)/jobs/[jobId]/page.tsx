import { notFound } from "next/navigation";

import { GeneratedDocuments } from "@/components/applications/generated-documents";
import { PageHeader } from "@/components/layout/page-header";
import { JobActions } from "@/components/jobs/job-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getJobDetailData } from "@/lib/data/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ScoreReason } from "@/types";

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
  const reasons = Array.isArray(match?.reasons) ? (match.reasons as ScoreReason[]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Job detail"
        title={`${job.title} at ${job.company}`}
        description="Review the fit explanation, inspect the discovery source, generate editable application materials, and open the official application page manually when you are ready."
        actions={<JobActions applicationUrl={job.applicationUrl} jobId={job.id} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white/82">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription className="mt-2">
                {job.company} | {job.location} | {job.workMode ?? "Not specified"}
              </CardDescription>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--primary)] px-5 py-4 text-center text-white">
              <p className="text-xs uppercase tracking-[0.24em]">Match</p>
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
            <p>
              Salary:{" "}
              {job.salaryMin || job.salaryMax
                ? `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`
                : "Not listed"}
            </p>
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
          <Card className="bg-white/82">
            <CardTitle>Why this job scored the way it did</CardTitle>
            <div className="mt-4 space-y-3">
              {reasons.length ? (
                reasons.map((reason) => (
                  <div
                    key={reason.label}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      reason.tone === "positive"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : reason.tone === "warning"
                          ? "bg-[var(--accent)]/18 text-[#8a6100]"
                          : "bg-[var(--muted-surface)] text-[var(--secondary)]"
                    }`}
                  >
                    {reason.label}
                  </div>
                ))
              ) : (
                <CardDescription>No detailed reasons are available yet.</CardDescription>
              )}
            </div>

            {match?.missingSkills.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[var(--secondary)]">Missing or unclear skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {match.missingSkills.map((skill) => (
                    <Badge key={skill} variant="danger">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <GeneratedDocuments documents={job.generatedDocuments} />
        </div>
      </div>
    </div>
  );
}
