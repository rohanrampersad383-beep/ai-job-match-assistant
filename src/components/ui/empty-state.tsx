import { PropsWithChildren } from "react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  children
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <Card className="border border-dashed border-[var(--border-strong)] bg-white/65 py-10 text-center">
      <div className="mx-auto max-w-xl">
        <CardTitle className="mb-2 text-2xl">{title}</CardTitle>
        <CardDescription className="text-[15px]">{description}</CardDescription>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
