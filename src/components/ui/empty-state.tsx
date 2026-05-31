import { PropsWithChildren } from "react";
import { Sparkles } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  children
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <Card className="motion-signal-surface overflow-hidden border border-dashed border-[var(--border-strong)] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.1),transparent_34%),var(--surface)] py-10 text-center">
      <div className="mx-auto max-w-xl">
        <span className="mx-auto mb-4 grid size-11 place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent-cyan)]">
          <Sparkles className="size-5" />
        </span>
        <CardTitle className="mb-2 text-2xl">{title}</CardTitle>
        <CardDescription className="text-[15px]">{description}</CardDescription>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
