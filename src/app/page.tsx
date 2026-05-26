import Link from "next/link";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";

export default function HomePage() {
  return (
    <main className="container-shell flex min-h-screen flex-col justify-center py-12">
      <section className="glass-panel motion-fade-in min-w-0 rounded-[var(--radius-panel)] border p-6 sm:p-10 md:p-14">
        <div className="mb-8">
          <MatchIQLogo markClassName="size-12" textClassName="text-2xl" />
        </div>
        <div className="grid min-w-0 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 space-y-6">
            <p className="max-w-xl text-sm font-semibold uppercase text-[var(--accent-cyan)]">
              AI-powered career intelligence
            </p>
            <h1 className="max-w-3xl break-words font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-6xl">
              Rank opportunities, understand fit, and move with sharper confidence.
            </h1>
            <p className="max-w-2xl break-words text-lg leading-8 text-[var(--muted)]">
              Upload your resume, define your preferences, import jobs from approved
              sources, and review ranked matches with clear reasoning before you apply
              manually on the official company page.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="rounded-full bg-[image:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                Start with MatchIQ
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-sm font-semibold text-[var(--secondary-strong)]"
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="motion-glow-hover min-w-0 rounded-[1.5rem] border border-[var(--border)] bg-[var(--card-strong)] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--muted)]">Top Match</p>
                <p className="text-2xl font-semibold leading-tight">Full-Stack PHP Developer</p>
              </div>
              <div className="w-fit shrink-0 rounded-2xl bg-[image:var(--gradient-brand)] px-4 py-3 text-center text-[var(--primary-foreground)]">
                <p className="text-xs uppercase">Fit</p>
                <p className="text-2xl font-semibold">91%</p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                Strong match on PHP, Laravel, MySQL, and JavaScript.
              </div>
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                Remote preference and salary target both align.
              </div>
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                Official application link only. Final submission always stays manual.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
