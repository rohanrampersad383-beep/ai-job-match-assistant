"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/shared";

type SourceFormProps = {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  defaults?: {
    id?: string;
    name?: string;
    sourceType?: string;
    baseUrl?: string;
    publicUrl?: string | null;
    fetchStrategy?: string;
    parserKey?: string;
    legalNotes?: string;
    defaultTags?: string[] | string;
    regionTags?: string[] | string;
    pollingIntervalMinutes?: number;
    dedupeStrategy?: string;
    enabled?: boolean;
    config?: unknown;
  };
  submitLabel?: string;
  title?: string;
  description?: string;
};

function joinList(value?: string[] | string) {
  return Array.isArray(value) ? value.join(", ") : value ?? "";
}

export function SourceForm({
  action,
  defaults = {},
  submitLabel = "Save source",
  title = "Add discovery source",
  description = "Register only lawful public sources. Unsupported or risky sources should stay disabled."
}: SourceFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="grid gap-4">
      {defaults.id ? <input name="id" type="hidden" value={defaults.id} /> : null}
      <Card className="bg-white/82">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>

        <div className="mt-6 grid gap-5">
          <section className="rounded-[1.5rem] border border-white/65 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Source identity
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                Define where the jobs come from and how this connector should be treated operationally.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Source name</FieldLabel>
                <Input defaultValue={defaults.name ?? ""} name="name" placeholder="EmployTT Public Jobs" required />
              </Field>
              <Field>
                <FieldLabel>Source type</FieldLabel>
                <Select defaultValue={defaults.sourceType ?? "RSS"} name="sourceType">
                  <option value="RSS">RSS</option>
                  <option value="API">API</option>
                  <option value="HTML">HTML</option>
                  <option value="CSV">CSV</option>
                  <option value="MANUAL">Manual fallback</option>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Base URL</FieldLabel>
                <Input defaultValue={defaults.baseUrl ?? ""} name="baseUrl" placeholder="https://example.com" required />
              </Field>
              <Field>
                <FieldLabel>Public URL</FieldLabel>
                <Input
                  defaultValue={defaults.publicUrl ?? ""}
                  name="publicUrl"
                  placeholder="https://example.com/jobs or public feed URL"
                />
                <FieldHint>Use the canonical public listing or feed URL when it differs from the fetch endpoint.</FieldHint>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/65 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Retrieval and parsing
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                Configure how the source is fetched, parsed, and deduplicated before jobs reach the review queue.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Fetch strategy</FieldLabel>
                <Input
                  defaultValue={defaults.fetchStrategy ?? ""}
                  name="fetchStrategy"
                  placeholder="public-rss-polling"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Parser key</FieldLabel>
                <Input
                  defaultValue={defaults.parserKey ?? ""}
                  name="parserKey"
                  placeholder="employtt-html"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Polling interval (minutes)</FieldLabel>
                <Input
                  defaultValue={String(defaults.pollingIntervalMinutes ?? 360)}
                  min={5}
                  name="pollingIntervalMinutes"
                  type="number"
                />
                <FieldHint>Use shorter intervals only for sources that clearly allow frequent public access.</FieldHint>
              </Field>
              <Field>
                <FieldLabel>Dedupe strategy</FieldLabel>
                <Input
                  defaultValue={defaults.dedupeStrategy ?? "canonical_url_or_company_title_location"}
                  name="dedupeStrategy"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Default tags</FieldLabel>
                <Input defaultValue={joinList(defaults.defaultTags)} name="defaultTags" placeholder="remote, public" />
              </Field>
              <Field>
                <FieldLabel>Region tags</FieldLabel>
                <Input
                  defaultValue={joinList(defaults.regionTags)}
                  name="regionTags"
                  placeholder="trinidad-and-tobago, caribbean"
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Config JSON</FieldLabel>
                <Textarea
                  defaultValue={JSON.stringify(defaults.config ?? {}, null, 2)}
                  name="configJson"
                  placeholder={'{\n  "feedUrl": "https://example.com/feed.xml"\n}'}
                />
                <FieldHint>Keep source-specific parser settings here so adapters stay modular and easy to disable.</FieldHint>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/65 bg-white/72 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Legal and safety notes
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                Capture why the source is allowed and when it should be disabled to keep discovery lawful and easy to audit.
              </p>
            </div>
            <Field>
              <FieldLabel>Legal notes / restrictions</FieldLabel>
              <Textarea
                defaultValue={defaults.legalNotes ?? ""}
                name="legalNotes"
                placeholder="Publicly accessible listings only. No login, no paywall, respect robots/rate limits and terms."
                required
              />
              <FieldHint>
                Record any parser limitations, rate limits, terms requirements, or reasons the source must remain disabled by default.
              </FieldHint>
            </Field>
          </section>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-[1.35rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-white/90">
          <input className="mt-1 size-4 accent-[var(--primary)]" defaultChecked={defaults.enabled ?? true} name="enabled" type="checkbox" />
          <span>
            Enable this source immediately.
            <FieldHint className="mt-1 block">
              Leave risky or incomplete adapters disabled until the legal and parsing behavior is confirmed.
            </FieldHint>
          </span>
        </label>
      </Card>

      <ActionMessage state={state} />
      <SubmitButton pendingLabel="Saving..." type="submit">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
