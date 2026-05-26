import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-12">
      <div className="glass-panel max-w-xl rounded-[2rem] p-10 text-center">
        <p className="text-sm font-semibold uppercase text-[var(--primary)]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--foreground)]">
          This page could not be found
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          The page may have moved, or the job record may no longer exist.
        </p>
        <Link
          className="mt-6 inline-flex rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
