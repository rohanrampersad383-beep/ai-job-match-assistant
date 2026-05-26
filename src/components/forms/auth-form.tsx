"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/actions/shared";

type AuthFormProps = {
  title: string;
  description: string;
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  submitLabel: string;
  includeName?: boolean;
};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  includeName = false
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <Card className="w-full max-w-xl bg-[var(--surface)]">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>
      <form action={formAction} className="mt-6 flex flex-col gap-4">
        {includeName ? (
          <Field>
            <FieldLabel>Full name</FieldLabel>
            <Input name="fullName" placeholder="Rohan Patel" required />
          </Field>
        ) : null}
        <Field>
          <FieldLabel>Email address</FieldLabel>
          <Input name="email" placeholder="you@example.com" type="email" required />
        </Field>
        <Field>
          <FieldLabel>Password</FieldLabel>
          <Input name="password" type="password" placeholder="At least 8 characters" required />
        </Field>
        <ActionMessage state={state} />
        <Button disabled={pending} type="submit">
          {pending ? "Working..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
