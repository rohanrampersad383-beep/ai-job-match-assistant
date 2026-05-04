import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-shell flex min-h-screen flex-col justify-center py-12">
      <section className="glass-panel rounded-[2rem] border p-10 md:p-14">
        <div className="mb-8 inline-flex items-center rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm text-[var(--secondary)]">
          Legal, user-controlled job discovery
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="max-w-xl text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Job Match Assistant
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Find roles you are likely qualified for and prepare applications faster.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Upload your resume, define your preferences, import jobs from approved
              sources, and review ranked matches with clear reasoning before you apply
              manually on the official company page.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
              >
                Start the MVP
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-[var(--border)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--secondary)]"
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card-strong)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">Top Match</p>
                <p className="text-2xl font-semibold">Full-Stack PHP Developer</p>
              </div>
              <div className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-[var(--primary-foreground)]">
                <p className="text-xs uppercase tracking-[0.24em]">Fit</p>
                <p className="text-2xl font-semibold">91%</p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <div className="rounded-2xl bg-[var(--muted-surface)] p-4">
                Strong match on PHP, Laravel, MySQL, and JavaScript.
              </div>
              <div className="rounded-2xl bg-[var(--muted-surface)] p-4">
                Remote preference and salary target both align.
              </div>
              <div className="rounded-2xl bg-[var(--muted-surface)] p-4">
                Official application link only. Final submission always stays manual.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
