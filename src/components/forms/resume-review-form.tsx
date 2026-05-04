"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/shared";

type ResumeReviewFormProps = {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  resumeId: string;
  defaults: Record<string, string | number | undefined>;
};

export function ResumeReviewForm({ action, resumeId, defaults }: ResumeReviewFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="grid gap-6">
      <input name="resumeId" type="hidden" value={resumeId} />
      <Card className="bg-white/82">
        <CardTitle>Review extracted resume data</CardTitle>
        <CardDescription className="mt-2">
          Correct the parser output before relying on it for scoring or application drafts. Focus first on identity,
          contact data, and the details most likely to affect match quality.
        </CardDescription>
        <div className="mt-6 grid gap-5">
          <section className="rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Identity and contact
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                Check these first. Inaccurate name or contact details make the rest of the resume review less useful.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Full name</FieldLabel>
                <Input defaultValue={String(defaults.fullName ?? "")} name="fullName" />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input defaultValue={String(defaults.email ?? "")} name="email" type="email" />
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input defaultValue={String(defaults.phone ?? "")} name="phone" />
              </Field>
              <Field>
                <FieldLabel>Location</FieldLabel>
                <Input defaultValue={String(defaults.location ?? "")} name="location" />
              </Field>
              <Field>
                <FieldLabel>Years of experience</FieldLabel>
                <Input
                  defaultValue={String(defaults.yearsExperience ?? 0)}
                  name="yearsExperience"
                  type="number"
                />
                <FieldHint>Use your real total experience so scoring stays grounded.</FieldHint>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Summary</FieldLabel>
                <Textarea defaultValue={String(defaults.summary ?? "")} name="summary" />
                <FieldHint>Keep this aligned with the actual resume, not what you want the parser to infer.</FieldHint>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Skills and credentials
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                Adjust the extracted lists where the parser missed a tool, duplicated a term, or put information in the wrong bucket.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Technical skills</FieldLabel>
                <Textarea defaultValue={String(defaults.technicalSkills ?? "")} name="technicalSkills" />
              </Field>
              <Field>
                <FieldLabel>Soft skills</FieldLabel>
                <Textarea defaultValue={String(defaults.softSkills ?? "")} name="softSkills" />
              </Field>
              <Field>
                <FieldLabel>Tools and platforms</FieldLabel>
                <Textarea defaultValue={String(defaults.toolsPlatforms ?? "")} name="toolsPlatforms" />
              </Field>
              <Field>
                <FieldLabel>Certifications</FieldLabel>
                <Textarea defaultValue={String(defaults.certifications ?? "")} name="certifications" />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Keywords</FieldLabel>
                <Textarea defaultValue={String(defaults.keywords ?? "")} name="keywords" />
                <FieldHint>These keywords are used by matching and draft-generation workflows, so clean duplicates here.</FieldHint>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Background details
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                These larger text areas are the most common place for parsing errors. Fix them before relying on job-match explanations.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Education</FieldLabel>
                <Textarea defaultValue={String(defaults.education ?? "")} name="education" />
              </Field>
              <Field>
                <FieldLabel>Job history</FieldLabel>
                <Textarea defaultValue={String(defaults.jobHistory ?? "")} name="jobHistory" />
              </Field>
              <Field>
                <FieldLabel>Projects</FieldLabel>
                <Textarea defaultValue={String(defaults.projects ?? "")} name="projects" />
              </Field>
              <Field>
                <FieldLabel>Review notes</FieldLabel>
                <Textarea defaultValue={String(defaults.reviewNotes ?? "")} name="reviewNotes" />
                <FieldHint>Add any corrections or parser caveats you want to remember later.</FieldHint>
              </Field>
            </div>
          </section>
        </div>
      </Card>

      <ActionMessage state={state} />
      <SubmitButton pendingLabel="Saving..." type="submit">
        Save reviewed resume data
      </SubmitButton>
    </form>
  );
}
