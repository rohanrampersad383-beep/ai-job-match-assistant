import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type RecommendedSource = Prisma.DiscoverySourceUncheckedCreateInput & {
  slug: string;
};

const recommendedSources: RecommendedSource[] = [
  {
    slug: "remoteok-public-api",
    name: "RemoteOK Public API",
    sourceType: "API",
    baseUrl: "https://remoteok.com",
    publicUrl: "https://remoteok.com/api",
    fetchStrategy: "public-json-api-polling",
    parserKey: "remoteok-api",
    legalNotes:
      "Use the public RemoteOK API endpoint only. Requests stay read-only, jobs retain source/apply URLs, and applications remain manual.",
    defaultTags: ["high-quality", "remote-friendly", "startup-source", "api", "tech"],
    regionTags: ["caribbean"],
    pollingIntervalMinutes: 240,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: { endpointPath: "/api", limit: 40 },
    enabled: true,
    healthStatus: "UNKNOWN",
    lastMessage: "Ready to fetch remote-first public API opportunities."
  },
  {
    slug: "we-work-remotely-rss",
    name: "We Work Remotely RSS",
    sourceType: "RSS",
    baseUrl: "https://weworkremotely.com",
    publicUrl: "https://weworkremotely.com/remote-job-rss-feed",
    fetchStrategy: "public-rss-polling",
    parserKey: "generic-rss",
    legalNotes:
      "Use the public RSS feeds with attribution back to We Work Remotely. No login automation, no protected areas, and no auto-apply behavior.",
    defaultTags: ["high-quality", "remote-friendly", "rss", "tech"],
    regionTags: ["caribbean"],
    pollingIntervalMinutes: 180,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: { feedUrl: "https://weworkremotely.com/remote-jobs.rss", maxItems: 30 },
    enabled: true,
    healthStatus: "UNKNOWN",
    lastMessage: "Ready to fetch remote jobs from the public RSS feed."
  },
  {
    slug: "greenhouse-premium-boards",
    name: "Greenhouse Premium Boards",
    sourceType: "API",
    baseUrl: "https://boards-api.greenhouse.io",
    publicUrl: "https://developers.greenhouse.io/job-board",
    fetchStrategy: "public-ats-json-api-polling",
    parserKey: "greenhouse-board",
    legalNotes:
      "Uses Greenhouse Job Board public GET endpoints only. Application submission endpoints are intentionally excluded.",
    defaultTags: ["high-quality", "startup-source", "official-board", "tech"],
    regionTags: [],
    pollingIntervalMinutes: 360,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: {
      limitPerBoard: 12,
      boards: [
        { token: "stripe", label: "Stripe" },
        { token: "airbnb", label: "Airbnb" }
      ]
    },
    enabled: true,
    healthStatus: "UNKNOWN",
    lastMessage: "Ready to fetch structured public Greenhouse boards."
  },
  {
    slug: "ashby-ai-startup-boards",
    name: "Ashby AI Startup Boards",
    sourceType: "API",
    baseUrl: "https://api.ashbyhq.com",
    publicUrl: "https://developers.ashbyhq.com/docs/public-job-posting-api",
    fetchStrategy: "public-ats-json-api-polling",
    parserKey: "ashby-board",
    legalNotes:
      "Uses Ashby's public job posting API for listed jobs only. Compensation is fetched when the public endpoint provides it.",
    defaultTags: ["high-quality", "startup-source", "official-board", "ai", "tech"],
    regionTags: [],
    pollingIntervalMinutes: 360,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: {
      includeCompensation: true,
      limitPerBoard: 12,
      boards: [
        { name: "perplexity", label: "Perplexity" },
        { name: "notion", label: "Notion" }
      ]
    },
    enabled: true,
    healthStatus: "UNKNOWN",
    lastMessage: "Ready to fetch structured Ashby AI/startup boards."
  },
  {
    slug: "lever-public-board-template",
    name: "Lever Public Board Template",
    sourceType: "API",
    baseUrl: "https://api.lever.co",
    publicUrl: "https://github.com/lever/postings-api",
    fetchStrategy: "public-ats-json-api-polling",
    parserKey: "lever-board",
    legalNotes:
      "Adapter supports Lever's public postings API. Keep disabled until exact target site names are configured and confirmed to return public listings.",
    defaultTags: ["needs-review", "official-board", "startup-source", "tech"],
    regionTags: [],
    pollingIntervalMinutes: 360,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: {
      limitPerSite: 15,
      sites: []
    },
    enabled: false,
    healthStatus: "DISABLED",
    lastMessage: "Configure confirmed Lever site names before enabling."
  },
  {
    slug: "yc-jobs-public-reference",
    name: "Y Combinator Jobs Reference",
    sourceType: "API",
    baseUrl: "https://www.ycombinator.com",
    publicUrl: "https://www.ycombinator.com/jobs",
    fetchStrategy: "public-reference-no-brittle-scraping",
    parserKey: "yc-jobs-reference",
    legalNotes:
      "YC Jobs is tracked as a high-value startup source, but MatchIQ does not scrape it until a stable documented bulk endpoint or feed is configured.",
    defaultTags: ["high-quality", "startup-source", "needs-review", "tech"],
    regionTags: [],
    pollingIntervalMinutes: 720,
    dedupeStrategy: "canonical_url_or_company_title_location",
    config: {},
    enabled: false,
    healthStatus: "DISABLED",
    lastMessage: "Public reference source only; disabled to avoid brittle scraping."
  }
];

export async function syncRecommendedDiscoverySources() {
  const existingSources = await prisma.discoverySource.findMany({
    where: {
      slug: {
        in: recommendedSources.map((source) => source.slug)
      }
    },
    select: {
      slug: true,
      sourceType: true,
      fetchStrategy: true,
      parserKey: true,
      defaultTags: true
    }
  });
  const existingBySlug = new Map(existingSources.map((source) => [source.slug, source]));

  for (const source of recommendedSources) {
    const existing = existingBySlug.get(source.slug);
    const defaultTags = Array.isArray(source.defaultTags) ? source.defaultTags : [];
    const needsRefresh =
      existing &&
      (existing.sourceType !== source.sourceType ||
        existing.fetchStrategy !== source.fetchStrategy ||
        existing.parserKey !== source.parserKey ||
        !defaultTags.every((tag) => existing.defaultTags.includes(tag)));

    if (!existing) {
      await prisma.discoverySource.create({ data: source });
      continue;
    }

    if (needsRefresh) {
      await prisma.discoverySource.update({
        where: { slug: source.slug },
        data: {
          name: source.name,
          sourceType: source.sourceType,
          baseUrl: source.baseUrl,
          publicUrl: source.publicUrl,
          fetchStrategy: source.fetchStrategy,
          parserKey: source.parserKey,
          legalNotes: source.legalNotes,
          defaultTags: source.defaultTags,
          regionTags: source.regionTags,
          pollingIntervalMinutes: source.pollingIntervalMinutes,
          dedupeStrategy: source.dedupeStrategy,
          config: source.config
        }
      });
    }
  }
}
