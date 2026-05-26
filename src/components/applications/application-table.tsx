import Link from "next/link";

import { updateApplicationAction } from "@/lib/actions/applications";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export function ApplicationTable({
  applications
}: {
  applications: Array<{
    id: string;
    status: string;
    interviewStatus: string;
    appliedAt: Date | null;
    followUpDate: Date | null;
    notes: string | null;
    job: {
      id: string;
      title: string;
      company: string;
      applicationUrl: string;
    };
  }>;
}) {
  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <Card key={application.id} className="interactive-card bg-[var(--surface)] p-5">
          <form action={updateApplicationAction} className="grid gap-5">
            <input name="applicationId" type="hidden" value={application.id} />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-[1.45rem] leading-tight">
                  <Link className="transition hover:text-[var(--primary)]" href={`/jobs/${application.job.id}`}>
                    {application.job.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-2">
                  {application.job.company} | Applied {formatDate(application.appliedAt)} | Follow-up{" "}
                  {formatDate(application.followUpDate)}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{application.status}</Badge>
                <Badge variant="info">{application.interviewStatus}</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--secondary)]">
                Status
                <Select defaultValue={application.status} name="status">
                  <option value="NOT_STARTED">NOT_STARTED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="APPLIED">APPLIED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="INTERVIEWING">INTERVIEWING</option>
                  <option value="OFFER">OFFER</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </Select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--secondary)]">
                Interview status
                <Select defaultValue={application.interviewStatus} name="interviewStatus">
                  <option value="NONE">NONE</option>
                  <option value="SCREENING">SCREENING</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="PANEL">PANEL</option>
                  <option value="FINAL">FINAL</option>
                  <option value="COMPLETE">COMPLETE</option>
                </Select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--secondary)]">
                Follow-up date
                <input
                  className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-sm transition hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  defaultValue={application.followUpDate ? new Date(application.followUpDate).toISOString().slice(0, 10) : ""}
                  name="followUpDate"
                  type="date"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--secondary)]">
              Notes
              <Textarea
                className="min-h-28"
                defaultValue={application.notes ?? ""}
                name="notes"
                placeholder="Interview notes, follow-up plan, or application context"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <SubmitButton pendingLabel="Saving..." type="submit" variant="secondary">
                Update tracker entry
              </SubmitButton>
              <a
                className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--secondary)]"
                href={application.job.applicationUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open source link
              </a>
            </div>
          </form>
        </Card>
      ))}
    </div>
  );
}
