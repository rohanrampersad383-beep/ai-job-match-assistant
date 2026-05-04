"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/shared";

type ProfileFormProps = {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  defaults?: Record<string, string | number | boolean | string[] | null | undefined>;
  redirectTo?: string;
  submitLabel?: string;
};

const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"];
const SENIORITY = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"];

export function ProfileForm({
  action,
  defaults = {},
  redirectTo,
  submitLabel = "Save profile"
}: ProfileFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="grid gap-6">
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      <Card className="bg-white/82">
        <CardTitle>Profile basics</CardTitle>
        <CardDescription className="mt-2">
          Capture your core profile so matching and draft generation stay grounded in real experience.
        </CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Full name</FieldLabel>
            <Input defaultValue={String(defaults.fullName ?? "")} name="fullName" required />
          </Field>
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <Input defaultValue={String(defaults.phone ?? "")} name="phone" />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>Professional headline</FieldLabel>
            <Input
              defaultValue={String(defaults.headline ?? "")}
              name="headline"
              placeholder="Full-stack developer focused on SaaS platforms"
            />
          </Field>
          <Field>
            <FieldLabel>Years of experience</FieldLabel>
            <Input
              defaultValue={String(defaults.yearsExperience ?? 0)}
              min={0}
              name="yearsExperience"
              type="number"
            />
          </Field>
          <Field>
            <FieldLabel>Minimum salary</FieldLabel>
            <Input
              defaultValue={String(defaults.minimumSalary ?? "")}
              min={0}
              name="minimumSalary"
              type="number"
              placeholder="85000"
            />
          </Field>
        </div>
      </Card>

      <Card className="bg-white/82">
        <CardTitle>Targeting preferences</CardTitle>
        <CardDescription className="mt-2">
          These preferences shape discovery, scoring, and the shortlist shown in the dashboard and review queue.
        </CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Desired job titles</FieldLabel>
            <Textarea
              defaultValue={String(defaults.desiredJobTitles ?? "")}
              name="desiredJobTitles"
              placeholder="Software Engineer, PHP Developer, Full-Stack Developer"
            />
          </Field>
          <Field>
            <FieldLabel>Preferred industries</FieldLabel>
            <Textarea
              defaultValue={String(defaults.preferredIndustries ?? "")}
              name="preferredIndustries"
              placeholder="SaaS, FinTech, HealthTech"
            />
          </Field>
          <Field>
            <FieldLabel>Preferred locations</FieldLabel>
            <Textarea
              defaultValue={String(defaults.preferredLocations ?? "")}
              name="preferredLocations"
              placeholder="Remote, Austin, New York"
            />
          </Field>
          <Field>
            <FieldLabel>Top skills</FieldLabel>
            <Textarea
              defaultValue={String(defaults.topSkills ?? "")}
              name="topSkills"
              placeholder="PHP, Laravel, MySQL, TypeScript"
            />
          </Field>
          <Field>
            <FieldLabel>Certifications</FieldLabel>
            <Textarea
              defaultValue={String(defaults.certifications ?? "")}
              name="certifications"
              placeholder="AWS Cloud Practitioner"
            />
          </Field>
          <Field>
            <FieldLabel>Degree / education</FieldLabel>
            <Input defaultValue={String(defaults.degree ?? "")} name="degree" />
          </Field>
          <Field>
            <FieldLabel>Include keywords</FieldLabel>
            <Textarea
              defaultValue={String(defaults.includeKeywords ?? "")}
              name="includeKeywords"
              placeholder="api, typescript, remote"
            />
          </Field>
          <Field>
            <FieldLabel>Exclude keywords</FieldLabel>
            <Textarea
              defaultValue={String(defaults.excludeKeywords ?? "")}
              name="excludeKeywords"
              placeholder="clearance, onsite-only"
            />
          </Field>
          <Field>
            <FieldLabel>Target companies</FieldLabel>
            <Textarea
              defaultValue={String(defaults.targetCompanies ?? "")}
              name="targetCompanies"
              placeholder="Stripe, Shopify"
            />
          </Field>
          <Field>
            <FieldLabel>Avoid companies</FieldLabel>
            <Textarea
              defaultValue={String(defaults.avoidCompanies ?? "")}
              name="avoidCompanies"
              placeholder="Example Corp"
            />
          </Field>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel>Work mode preference</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {WORK_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-white/85 px-4 py-2 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white"
                >
                  <input
                    className="size-4 accent-[var(--primary)]"
                    defaultChecked={Array.isArray(defaults.workModes) && defaults.workModes.includes(mode)}
                    name="workModes"
                    type="checkbox"
                    value={mode}
                  />
                  {mode}
                </label>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel>Target seniority</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {SENIORITY.map((level) => (
                <label
                  key={level}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-white/85 px-4 py-2 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white"
                >
                  <input
                    className="size-4 accent-[var(--primary)]"
                    defaultChecked={Array.isArray(defaults.seniorityLevels) && defaults.seniorityLevels.includes(level)}
                    name="seniorityLevels"
                    type="checkbox"
                    value={level}
                  />
                  {level}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-6 rounded-2xl bg-white/70 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white/95">
              <input
                className="mt-1 size-4 accent-[var(--primary)]"
                defaultChecked={defaults.prioritizeTrinidad !== false}
                name="prioritizeTrinidad"
                type="checkbox"
              />
              <span>
                Prioritize Trinidad and Tobago roles.
                <FieldHint className="mt-1 block">
                  Boosts roles in Trinidad and Tobago and makes them easier to filter.
                </FieldHint>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white/95">
              <input
                className="mt-1 size-4 accent-[var(--primary)]"
                defaultChecked={defaults.allowCaribbeanRemote !== false}
                name="allowCaribbeanRemote"
                type="checkbox"
              />
              <span>
                Allow Caribbean-friendly remote roles.
                <FieldHint className="mt-1 block">
                  Keeps remote roles open to Trinidad and Tobago candidates in the ranking flow.
                </FieldHint>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white/95">
              <input
                className="mt-1 size-4 accent-[var(--primary)]"
                defaultChecked={Boolean(defaults.autoHideEnabled)}
                name="autoHideEnabled"
                type="checkbox"
              />
              <span>
                Auto-hide obvious poor-fit jobs when possible.
                <FieldHint className="mt-1 block">
                  Hidden records stay manual and reversible. Nothing is auto-applied.
                </FieldHint>
              </span>
            </label>
          </div>
        </div>
      </Card>

      <ActionMessage state={state} />
      <SubmitButton pendingLabel="Saving..." type="submit">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
