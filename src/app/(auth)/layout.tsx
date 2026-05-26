import { PropsWithChildren } from "react";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="container-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden max-w-2xl lg:block">
        <MatchIQLogo markClassName="size-12" textClassName="text-2xl" />
        <h1 className="mt-8 max-w-xl font-display text-5xl font-semibold leading-none text-[var(--foreground-strong)]">
          Career intelligence for sharper opportunity decisions.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-8 text-[var(--muted-strong)]">
          MatchIQ helps transform discovery, fit scoring, and application prep into a focused human-controlled workflow.
        </p>
      </section>
      <section className="flex justify-center">{children}</section>
    </main>
  );
}
