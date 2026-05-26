import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReviewQueueFilters({
  defaults,
  sources
}: {
  defaults: {
    query?: string;
    sourceId?: string;
    trinidadOnly?: boolean;
    remoteOnly?: boolean;
    recentDays?: number;
  };
  sources: Array<{
    id: string;
    name: string;
  }>;
}) {
  return (
    <Card className="bg-[var(--surface)]">
      <form className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground-strong)]">Review queue filters</p>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Narrow new discovery results by source, freshness, and Trinidad-first relevance.
            </p>
          </div>
          <SubmitButton type="submit" variant="secondary">
            Apply filters
          </SubmitButton>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(220px,1fr)_minmax(180px,0.8fr)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-11"
              defaultValue={defaults.query}
              name="query"
              placeholder="Search title, company, location, source"
            />
          </label>
          <Select defaultValue={defaults.sourceId ?? ""} name="sourceId">
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={String(defaults.recentDays ?? 7)} name="recentDays">
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={defaults.trinidadOnly ?? true}
              name="trinidadOnly"
              type="checkbox"
            />
            <span>
              Trinidad and Tobago only
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Keeps the queue focused on local roles and Trinidad-relevant listings first.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              defaultChecked={Boolean(defaults.remoteOnly)}
              name="remoteOnly"
              type="checkbox"
            />
            <span>
              Remote-friendly only
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Surfaces roles that are explicitly remote or friendly to candidates in Trinidad and Tobago.
              </span>
            </span>
          </label>
        </div>
      </form>
    </Card>
  );
}
