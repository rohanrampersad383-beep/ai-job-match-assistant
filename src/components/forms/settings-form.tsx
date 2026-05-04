"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/shared";

const weightFields = [
  "titleWeight",
  "skillsWeight",
  "experienceWeight",
  "educationWeight",
  "locationWeight",
  "remoteWeight",
  "trinidadBoostWeight",
  "sourceTrustWeight",
  "salaryWeight",
  "certificationsWeight",
  "keywordWeight",
  "blacklistPenalty",
  "mismatchPenalty",
  "autoHideMinMatchPercent"
] as const;

export function SettingsForm({
  action,
  defaults
}: {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  defaults: Record<string, string | number | undefined>;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="grid gap-6">
      <Card className="bg-white/82">
        <CardTitle>Scoring weights</CardTitle>
        <CardDescription className="mt-2">
          Control how much each criterion contributes to the overall fit percentage.
        </CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {weightFields.map((field) => (
            <Field key={field}>
              <FieldLabel>{field}</FieldLabel>
              <Input
                defaultValue={String(defaults[field] ?? 0)}
                min={0}
                max={100}
                name={field}
                type="number"
              />
              <FieldHint>
                {field === "autoHideMinMatchPercent"
                  ? "Jobs below this threshold can be hidden automatically when auto-hide is enabled."
                  : "Use practical weight values so one criterion does not drown out the rest of the score."}
              </FieldHint>
            </Field>
          ))}
        </div>
      </Card>

      <Card className="bg-white/82">
        <CardTitle>Keyword and family rules</CardTitle>
        <CardDescription className="mt-2">
          Use these controls to steer the discovery engine toward your target job families without losing transparency.
        </CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Target job families</FieldLabel>
            <Textarea defaultValue={String(defaults.targetJobFamilies ?? "")} name="targetJobFamilies" />
          </Field>
          <Field>
            <FieldLabel>Global include keywords</FieldLabel>
            <Textarea defaultValue={String(defaults.includeKeywords ?? "")} name="includeKeywords" />
          </Field>
          <Field>
            <FieldLabel>Global exclude keywords</FieldLabel>
            <Textarea defaultValue={String(defaults.excludeKeywords ?? "")} name="excludeKeywords" />
          </Field>
        </div>
      </Card>

      <ActionMessage state={state} />
      <SubmitButton pendingLabel="Saving..." type="submit">
        Save scoring settings
      </SubmitButton>
    </form>
  );
}
