import { FetchLogLevel, WorkMode } from "@prisma/client";

import type {
  DiscoveryFetchObserver,
  DiscoverySourceAdapter,
  DiscoverySourceRecord,
  FetchedSourceItem
} from "@/lib/discovery/types";
import { sanitizeText, uniqueArray } from "@/lib/utils";

const STRUCTURED_PARSER_KEYS = new Set([
  "remoteok-api",
  "greenhouse-board",
  "lever-board",
  "ashby-board",
  "yc-jobs-reference"
]);

type SourceConfig = Record<string, unknown>;

function getConfig(source: DiscoverySourceRecord) {
  return (source.config ?? {}) as SourceConfig;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asRecordArray(value: unknown) {
  return Array.isArray(value) ? value.map(asRecord).filter((item) => Object.keys(item).length) : [];
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asString).filter(Boolean);
}

function sourceTags(source: DiscoverySourceRecord, extra: string[] = []) {
  return uniqueArray([...source.defaultTags, ...source.regionTags, ...extra]);
}

function coerceDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "number") {
    return new Date(value > 10_000_000_000 ? value : value * 1000);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function stripHtml(value: unknown) {
  return sanitizeText(asString(value));
}

function trimDescription(value: unknown) {
  const text = stripHtml(value);
  return text.length > 6000 ? `${text.slice(0, 6000)}...` : text;
}

function normalizeUrl(value: unknown, fallback: string) {
  const candidate = asString(value);

  if (!candidate) {
    return fallback;
  }

  try {
    return new URL(candidate, fallback).toString();
  } catch {
    return fallback;
  }
}

function salaryRange(min: unknown, max: unknown, currency = "USD") {
  const salaryMin = asNumber(min);
  const salaryMax = asNumber(max);

  if (!salaryMin && !salaryMax) {
    return undefined;
  }

  const left = salaryMin ? `${currency} ${salaryMin.toLocaleString("en-US")}` : "";
  const right = salaryMax ? `${currency} ${salaryMax.toLocaleString("en-US")}` : "";

  return [left, right].filter(Boolean).join(" - ");
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, application/rss+xml, */*",
      "User-Agent": "MatchIQ/1.0 (legal public job discovery; manual apply only)"
    },
    next: {
      revalidate: 0
    }
  });

  if (!response.ok) {
    throw new Error(`Structured source fetch failed with status ${response.status} for ${url}`);
  }

  return response.json() as Promise<unknown>;
}

async function fetchRemoteOk(source: DiscoverySourceRecord) {
  const config = getConfig(source);
  const endpoint = normalizeUrl(config.endpointUrl ?? config.endpointPath ?? "/api", source.baseUrl);
  const limit = asNumber(config.limit) ?? 40;
  const payload = await fetchJson(endpoint);
  const rows = Array.isArray(payload) ? payload.map(asRecord) : [];

  return rows
    .filter((job) => asString(job.position) || asString(job.title))
    .slice(0, limit)
    .map((job) => {
      const tags = stringArray(job.tags);
      const company = asString(job.company) || "Remote hiring company";
      const title = asString(job.position) || asString(job.title) || "Untitled remote role";
      const sourceUrl = normalizeUrl(job.url ?? job.slug, source.baseUrl);
      const salary = asString(job.salary) || salaryRange(job.salary_min, job.salary_max);

      return {
        externalId: asString(job.id) || asString(job.slug),
        sourceUrl,
        applicationUrl: normalizeUrl(job.apply_url ?? job.url, sourceUrl),
        title,
        company,
        locationRaw: asString(job.location) || "Remote",
        description: trimDescription(job.description),
        salaryRaw: salary,
        rawPayload: job as never,
        rawText: trimDescription(job.description),
        postedAt: coerceDate(job.date ?? job.epoch),
        tags: sourceTags(source, ["remoteok", "api-discovered", "remote", ...tags])
      } satisfies FetchedSourceItem;
    });
}

function configuredBoards(config: SourceConfig, singularKey: string, pluralKey: string) {
  const configured = asRecordArray(config[pluralKey]);

  if (configured.length) {
    return configured;
  }

  const single = asString(config[singularKey]);
  return single ? [{ token: single, name: single, site: single, label: single }] : [];
}

async function fetchGreenhouse(source: DiscoverySourceRecord, observer?: DiscoveryFetchObserver) {
  const config = getConfig(source);
  const boards = configuredBoards(config, "boardToken", "boards");
  const limitPerBoard = asNumber(config.limitPerBoard) ?? 25;
  const items: FetchedSourceItem[] = [];

  for (const board of boards) {
    const token = asString(board.token ?? board.name);
    if (!token) continue;

    const boardLabel = asString(board.label) || token;
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
    const payload = asRecord(await fetchJson(url));
    const jobs = asRecordArray(payload.jobs).slice(0, limitPerBoard);

    await observer?.onLog?.({
      level: FetchLogLevel.INFO,
      message: `Fetched ${jobs.length} Greenhouse jobs from ${boardLabel}.`
    });

    for (const job of jobs) {
      const location = asRecord(job.location);
      const departments = asRecordArray(job.departments).map((department) => asString(department.name)).filter(Boolean);
      const offices = asRecordArray(job.offices).map((office) => asString(office.name)).filter(Boolean);
      const sourceUrl = normalizeUrl(job.absolute_url, source.baseUrl);

      items.push({
        externalId: asString(job.id),
        sourceUrl,
        applicationUrl: sourceUrl,
        title: asString(job.title) || "Untitled Greenhouse role",
        company: boardLabel,
        locationRaw: asString(location.name) || offices.join(", ") || "Remote",
        description: trimDescription(job.content),
        rawPayload: { board: token, job } as never,
        rawText: trimDescription(job.content),
        postedAt: coerceDate(job.updated_at),
        tags: sourceTags(source, ["greenhouse", "official-board", ...departments, ...offices])
      });
    }
  }

  return items;
}

async function fetchLever(source: DiscoverySourceRecord, observer?: DiscoveryFetchObserver) {
  const config = getConfig(source);
  const sites = configuredBoards(config, "site", "sites");
  const limitPerSite = asNumber(config.limitPerSite) ?? 25;
  const items: FetchedSourceItem[] = [];

  for (const site of sites) {
    const siteName = asString(site.site ?? site.name ?? site.token);
    if (!siteName) continue;

    const region = asString(site.region).toLowerCase();
    const apiBase = region === "eu" ? "https://api.eu.lever.co" : "https://api.lever.co";
    const siteLabel = asString(site.label) || siteName;
    const url = `${apiBase}/v0/postings/${encodeURIComponent(siteName)}?mode=json&limit=${limitPerSite}`;
    const payload = await fetchJson(url);
    const jobs = Array.isArray(payload) ? payload.map(asRecord) : [];

    await observer?.onLog?.({
      level: FetchLogLevel.INFO,
      message: `Fetched ${jobs.length} Lever jobs from ${siteLabel}.`
    });

    for (const job of jobs.slice(0, limitPerSite)) {
      const categories = asRecord(job.categories);
      const salary = asRecord(job.salaryRange);
      const lists = asRecordArray(job.lists)
        .map((list) => `${asString(list.text)} ${stripHtml(list.content)}`.trim())
        .filter(Boolean)
        .join(" ");
      const workplaceType = asString(job.workplaceType);
      const sourceUrl = normalizeUrl(job.hostedUrl, `https://jobs.lever.co/${siteName}`);

      items.push({
        externalId: asString(job.id),
        sourceUrl,
        applicationUrl: normalizeUrl(job.applyUrl, sourceUrl),
        title: asString(job.text) || "Untitled Lever role",
        company: siteLabel,
        locationRaw: asString(categories.location) || "Remote",
        description: trimDescription(`${asString(job.descriptionPlain) || stripHtml(job.description)} ${lists}`),
        salaryRaw: asString(job.salaryDescriptionPlain) || salaryRange(salary.min, salary.max, asString(salary.currency) || "USD"),
        employmentType: asString(categories.commitment) || undefined,
        workMode: workplaceType === "remote" ? WorkMode.REMOTE : workplaceType === "hybrid" ? WorkMode.HYBRID : undefined,
        rawPayload: { site: siteName, job } as never,
        rawText: trimDescription(`${asString(job.descriptionPlain) || stripHtml(job.description)} ${lists}`),
        tags: sourceTags(source, ["lever", "official-board", asString(categories.team), asString(categories.department)])
      });
    }
  }

  return items;
}

async function fetchAshby(source: DiscoverySourceRecord, observer?: DiscoveryFetchObserver) {
  const config = getConfig(source);
  const boards = configuredBoards(config, "jobBoardName", "boards");
  const limitPerBoard = asNumber(config.limitPerBoard) ?? 25;
  const includeCompensation = config.includeCompensation !== false;
  const items: FetchedSourceItem[] = [];

  for (const board of boards) {
    const boardName = asString(board.name ?? board.token);
    if (!boardName) continue;

    const boardLabel = asString(board.label) || boardName;
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}?includeCompensation=${includeCompensation ? "true" : "false"}`;
    const payload = asRecord(await fetchJson(url));
    const jobs = asRecordArray(payload.jobs).slice(0, limitPerBoard);

    await observer?.onLog?.({
      level: FetchLogLevel.INFO,
      message: `Fetched ${jobs.length} Ashby jobs from ${boardLabel}.`
    });

    for (const job of jobs) {
      const compensation = asRecord(job.compensation);
      const secondaryLocations = asRecordArray(job.secondaryLocations)
        .map((location) => asString(location.location))
        .filter(Boolean);
      const sourceUrl = normalizeUrl(job.jobUrl, `https://jobs.ashbyhq.com/${boardName}`);
      const locationText = [asString(job.location), ...secondaryLocations].filter(Boolean).join(" / ") || "Remote";

      items.push({
        externalId: asString(job.id),
        sourceUrl,
        applicationUrl: normalizeUrl(job.applyUrl, sourceUrl),
        title: asString(job.title) || "Untitled Ashby role",
        company: boardLabel,
        locationRaw: locationText,
        description: trimDescription(job.descriptionPlain ?? job.descriptionHtml),
        salaryRaw:
          asString(compensation.compensationTierSummary) ||
          asString(compensation.scrapeableCompensationSalarySummary),
        employmentType: asString(job.employmentType) || undefined,
        rawPayload: { board: boardName, job } as never,
        rawText: trimDescription(job.descriptionPlain ?? job.descriptionHtml),
        postedAt: coerceDate(job.publishedAt ?? job.updatedAt),
        tags: sourceTags(source, ["ashby", "official-board", asString(job.department), asString(job.team)])
      });
    }
  }

  return items;
}

export const structuredJobBoardAdapter: DiscoverySourceAdapter = {
  type: "API",
  canHandle: (source) => source.sourceType === "API" && STRUCTURED_PARSER_KEYS.has(source.parserKey),
  async fetchItems(source, observer) {
    switch (source.parserKey) {
      case "remoteok-api":
        return fetchRemoteOk(source);
      case "greenhouse-board":
        return fetchGreenhouse(source, observer);
      case "lever-board":
        return fetchLever(source, observer);
      case "ashby-board":
        return fetchAshby(source, observer);
      case "yc-jobs-reference":
        await observer?.onLog?.({
          level: FetchLogLevel.WARN,
          message:
            "YC Jobs is registered as a public reference source only. MatchIQ does not run brittle scraping without a stable documented bulk feed."
        });
        return [];
      default:
        return [];
    }
  }
};
