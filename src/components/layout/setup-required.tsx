import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function SetupRequired() {
  return (
    <main className="container-shell flex min-h-screen items-center py-12">
      <Card className="mx-auto max-w-3xl">
        <CardTitle className="mb-4">Database setup required</CardTitle>
        <CardDescription className="mb-4">
          `DATABASE_URL` is not configured yet, so authenticated product pages cannot query
          users, resumes, jobs, or application records.
        </CardDescription>
        <CardDescription>
          Copy <code>.env.example</code> to <code>.env</code>, point it at PostgreSQL, run
          <code> npm run db:push</code>, then seed with <code>npm run db:seed</code>.
          Setup instructions are in{" "}
          <Link href="/" className="font-semibold text-[var(--primary)]">
            the project README
          </Link>
          .
        </CardDescription>
      </Card>
    </main>
  );
}
