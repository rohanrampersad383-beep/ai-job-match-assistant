import type { DiscoveryFetchObserver, DiscoverySourceAdapter, DiscoverySourceRecord } from "@/lib/discovery/types";

function buildApiUrl(source: DiscoverySourceRecord) {
  const config = (source.config ?? {}) as Record<string, unknown>;
  const base = new URL(String(config.endpointPath ?? "/api/search-jobs"), source.baseUrl);

  if (typeof config.query === "string" && config.query) {
    base.searchParams.set("query", config.query);
  }

  if (typeof config.category === "string" && config.category) {
    base.searchParams.set("category", config.category);
  }

  if (typeof config.page === "number") {
    base.searchParams.set("page", String(config.page));
  }

  return base.toString();
}

export const apiDiscoveryAdapter: DiscoverySourceAdapter = {
  type: "API",
  canHandle: (source) => source.sourceType === "API",
  async fetchItems(source, observer?: DiscoveryFetchObserver) {
    void observer;
    const response = await fetch(buildApiUrl(source), {
      method: "GET",
      headers: {
        "User-Agent": "JobMatchAssistant/1.0 (legal discovery fetcher)"
      },
      next: {
        revalidate: 0
      }
    });

    if (!response.ok) {
      throw new Error(`API fetch failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { jobs?: Array<Record<string, unknown>> };
    const jobs = payload.jobs ?? [];

    return jobs.map((job) => ({
      externalId: typeof job.id === "string" ? job.id : undefined,
      sourceUrl: typeof job.url === "string" ? job.url : source.baseUrl,
      applicationUrl: typeof job.url === "string" ? job.url : undefined,
      title: String(job.title ?? "Untitled remote job"),
      company: String(job.company_name ?? "Remote hiring company"),
      locationRaw: Array.isArray(job.locations) ? job.locations.join(", ") : "Remote",
      description: String(job.description ?? ""),
      salaryRaw:
        job.salary_min || job.salary_max
          ? `${job.salary_min ?? ""}-${job.salary_max ?? ""}`
          : undefined,
      rawPayload: job as never,
      postedAt: typeof job.published_at === "string" ? new Date(job.published_at) : null,
      tags: [...source.defaultTags, ...source.regionTags, "api-discovered", "remote"]
    }));
  }
};
