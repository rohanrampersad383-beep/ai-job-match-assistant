import { ResumeReviewForm } from "@/components/forms/resume-review-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { saveResumeReviewAction } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";
import { getResumeWorkspace } from "@/lib/data/dashboard";
import { formatDate } from "@/lib/utils";

const joinList = (value?: string[] | null) => (value ?? []).join(", ");

export default async function ResumePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const resumes = await getResumeWorkspace(user.id);
  const latestResume = resumes[0];
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resume"
        title="Upload and review your resume"
        description="Upload a PDF or DOCX resume, inspect the extracted fields, and correct them before the matching engine uses them."
      />

      <Card className="bg-[var(--surface)]">
        <CardTitle>Upload resume</CardTitle>
        <CardDescription className="mt-2">
          Files are parsed in-memory. The app stores raw extracted text plus structured review data in PostgreSQL.
        </CardDescription>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <form
            action="/api/resumes/upload"
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]"
            encType="multipart/form-data"
            method="post"
          >
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--foreground-strong)]">Upload a new version</p>
              <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">
                Supported files: PDF, DOC, DOCX, and TXT. Review the extracted fields below before using them for matching.
              </p>
            </div>

            {status ? (
              <p className="mb-4 rounded-[1rem] border border-[var(--success)]/25 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
                Resume uploaded successfully.
              </p>
            ) : null}

            {error ? (
              <p className="mb-4 rounded-[1rem] border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
                Resume upload failed.
              </p>
            ) : null}

            <div className="grid gap-4">
              <input
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--foreground-strong)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                name="resume"
                required
                type="file"
              />
              <Button className="w-fit" type="submit">
                Upload and parse
              </Button>
            </div>
          </form>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold text-[var(--foreground-strong)]">What to review closely</p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--secondary)]">
              <div className="surface-note">
                Identity and contact fields should be exact so exported drafts and profile updates stay usable.
              </div>
              <div className="surface-note">
                Skills, tools, and certifications often need cleanup when the parser reads dense bullet lists.
              </div>
              <div className="surface-note">
                Job history and education are used for scoring explanations, so correct obvious parsing drift here.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {latestResume ? (
        <>
          <Card className="bg-[var(--surface)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Latest upload</CardTitle>
                <CardDescription className="mt-2">Uploaded {formatDate(latestResume.createdAt)}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{latestResume.mimeType}</Badge>
                <Badge variant="discovery">{latestResume.fileName}</Badge>
              </div>
            </div>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--secondary)]">
              {latestResume.rawText}
            </pre>
          </Card>

          {latestResume.extractedData ? (
            <ResumeReviewForm
              action={saveResumeReviewAction}
              defaults={{
                fullName: latestResume.extractedData.fullName ?? "",
                email: latestResume.extractedData.email ?? "",
                phone: latestResume.extractedData.phone ?? "",
                location: latestResume.extractedData.location ?? "",
                summary: latestResume.extractedData.summary ?? "",
                yearsExperience: latestResume.extractedData.yearsExperience,
                technicalSkills: joinList(latestResume.extractedData.technicalSkills),
                softSkills: joinList(latestResume.extractedData.softSkills),
                toolsPlatforms: joinList(latestResume.extractedData.toolsPlatforms),
                certifications: joinList(latestResume.extractedData.certifications),
                education: joinList(
                  Array.isArray(latestResume.extractedData.education)
                    ? latestResume.extractedData.education.map((entry) => JSON.stringify(entry))
                    : []
                ),
                jobHistory: joinList(
                  Array.isArray(latestResume.extractedData.jobHistory)
                    ? latestResume.extractedData.jobHistory.map((entry) => JSON.stringify(entry))
                    : []
                ),
                projects: joinList(
                  Array.isArray(latestResume.extractedData.projects)
                    ? latestResume.extractedData.projects.map((entry) => JSON.stringify(entry))
                    : []
                ),
                keywords: joinList(latestResume.extractedData.keywords),
                reviewNotes: latestResume.extractedData.reviewNotes ?? ""
              }}
              resumeId={latestResume.id}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          description="Upload your first resume to unlock scoring and tailored application drafts."
          title="No resume uploaded yet"
        />
      )}
    </div>
  );
}
