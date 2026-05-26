import { ExternalLink } from "lucide-react";

import { generateDraftsAction, hideJobAction, markAppliedAction, markReviewedAction, saveJobAction } from "@/lib/actions/jobs";
import { SubmitButton } from "@/components/ui/submit-button";

export function JobActions({
  jobId,
  applicationUrl
}: {
  jobId: string;
  applicationUrl: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={saveJobAction}>
        <input name="jobId" type="hidden" value={jobId} />
        <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="secondary">
          Save
        </SubmitButton>
      </form>
      <form action={hideJobAction}>
        <input name="jobId" type="hidden" value={jobId} />
        <SubmitButton pendingLabel="Hiding..." size="sm" type="submit" variant="secondary">
          Hide
        </SubmitButton>
      </form>
      <form action={markReviewedAction}>
        <input name="jobId" type="hidden" value={jobId} />
        <SubmitButton pendingLabel="Updating..." size="sm" type="submit" variant="secondary">
          Mark reviewed
        </SubmitButton>
      </form>
      <form action={generateDraftsAction}>
        <input name="jobId" type="hidden" value={jobId} />
        <SubmitButton pendingLabel="Generating..." size="sm" type="submit">
          Draft materials
        </SubmitButton>
      </form>
      <form action={markAppliedAction}>
        <input name="jobId" type="hidden" value={jobId} />
        <SubmitButton pendingLabel="Updating..." size="sm" type="submit" variant="secondary">
          Mark applied
        </SubmitButton>
      </form>
      <a
        className="inline-flex items-center gap-2 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--secondary)]"
        href={applicationUrl}
        rel="noreferrer"
        target="_blank"
      >
        Open application link
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}
