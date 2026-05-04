"use client";

import { useActionState } from "react";

import { ActionMessage } from "@/components/forms/action-message";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/actions/shared";

type DiscoveryActionFormProps = {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  label: string;
  pendingLabel: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  hiddenFields?: Record<string, string>;
  className?: string;
};

export function DiscoveryActionForm({
  action,
  className,
  hiddenFields,
  label,
  pendingLabel,
  size = "md",
  variant = "secondary"
}: DiscoveryActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <div className={className}>
      <form action={formAction} className="grid gap-2">
        {hiddenFields
          ? Object.entries(hiddenFields).map(([key, value]) => (
              <input key={key} name={key} type="hidden" value={value} />
            ))
          : null}
        <Button loading={pending} size={size} type="submit" variant={variant}>
          {pending ? pendingLabel : label}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}
