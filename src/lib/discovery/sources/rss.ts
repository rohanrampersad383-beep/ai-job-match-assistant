import Parser from "rss-parser";

import type {
  DiscoveryFetchObserver,
  DiscoverySourceAdapter,
  DiscoverySourceRecord,
  FetchedSourceItem
} from "@/lib/discovery/types";

const parser = new Parser();

function inferCompanyAndTitle(rawTitle: string) {
  if (rawTitle.includes(" at ")) {
    const [title, company] = rawTitle.split(" at ");
    return {
      title: title.trim(),
      company: company.trim()
    };
  }

  if (rawTitle.includes(" - ")) {
    const [company, title] = rawTitle.split(" - ");
    return {
      title: title.trim(),
      company: company.trim()
    };
  }

  return {
    title: rawTitle.trim(),
    company: "Remote hiring company"
  };
}

function getFeedUrl(source: DiscoverySourceRecord) {
  const config = (source.config ?? {}) as Record<string, unknown>;
  return String(config.feedUrl ?? source.publicUrl ?? source.baseUrl);
}

function getMaxItems(source: DiscoverySourceRecord) {
  const config = (source.config ?? {}) as Record<string, unknown>;
  return Number(config.maxItems ?? 30);
}

export const rssDiscoveryAdapter: DiscoverySourceAdapter = {
  type: "RSS",
  canHandle: (source) => source.sourceType === "RSS",
  async fetchItems(source, observer?: DiscoveryFetchObserver) {
    void observer;
    const feed = await parser.parseURL(getFeedUrl(source));
    const maxItems = getMaxItems(source);

    return (feed.items ?? []).slice(0, maxItems).map((item) => {
      const inferred = inferCompanyAndTitle(item.title ?? "Untitled remote job");

      return {
        externalId: item.guid ?? item.id,
        sourceUrl: item.link ?? getFeedUrl(source),
        applicationUrl: item.link ?? undefined,
        title: inferred.title,
        company: inferred.company,
        locationRaw: "Remote",
        description: item.contentSnippet ?? item.content ?? item.summary ?? "",
        rawPayload: item as never,
        postedAt: item.pubDate ? new Date(item.pubDate) : null,
        tags: [...source.defaultTags, ...source.regionTags, "rss-discovered", "remote"]
      } satisfies FetchedSourceItem;
    });
  }
};
