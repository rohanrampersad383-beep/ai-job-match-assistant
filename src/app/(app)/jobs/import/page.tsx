import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function JobImportPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Approved ingestion"
        title="Import jobs from legal sources"
        description="Use manual job entry, pasted descriptions, CSV files, or RSS feeds. The app does not scrape LinkedIn or auto-submit applications."
      />

      {status ? <p className="text-sm text-[var(--success)]">Import completed successfully.</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">Import failed. Check the submitted data and try again.</p> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="bg-[var(--surface)]">
          <CardTitle>Manual job or pasted description</CardTitle>
          <CardDescription className="mt-2">
            Best when you want to add a single role from an approved source without any scraping.
          </CardDescription>
          <form action="/api/jobs/import/manual" className="mt-6 grid gap-3" method="post">
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" defaultValue="MANUAL_TEXT" name="sourceType" />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" defaultValue="Manual Entry" name="sourceName" />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="title" placeholder="Job title" required />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="company" placeholder="Company" required />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="location" placeholder="Location" required />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="applicationUrl" placeholder="Official application URL" required type="url" />
            <textarea className="min-h-40 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="description" placeholder="Paste the job description here" required />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="requiredSkills" placeholder="Required skills, comma separated" />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="preferredSkills" placeholder="Preferred skills, comma separated" />
            <button className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">
              Import manual job
            </button>
          </form>
        </Card>

        <Card className="bg-[var(--surface)]">
          <CardTitle>CSV import</CardTitle>
          <CardDescription className="mt-2">
            Upload or paste a CSV with columns such as title, company, location, description,
            applicationUrl, requiredSkills, and salary.
          </CardDescription>
          <form action="/api/jobs/import/csv" className="mt-6 grid gap-3" encType="multipart/form-data" method="post">
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" defaultValue="CSV Import" name="sourceName" />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" accept=".csv,text/csv" name="file" type="file" />
            <textarea className="min-h-40 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="csvText" placeholder="Or paste CSV rows here" />
            <button className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">
              Import CSV jobs
            </button>
          </form>
        </Card>

        <Card className="bg-[var(--surface)]">
          <CardTitle>RSS feed import</CardTitle>
          <CardDescription className="mt-2">
            Bring in roles from approved job feeds. This is intentionally limited to feed data the source already exposes.
          </CardDescription>
          <form action="/api/jobs/import/rss" className="mt-6 grid gap-3" method="post">
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" defaultValue="RSS Feed" name="sourceName" />
            <input className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" name="feedUrl" placeholder="https://example.com/jobs.rss" required type="url" />
            <button className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">
              Import RSS jobs
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

