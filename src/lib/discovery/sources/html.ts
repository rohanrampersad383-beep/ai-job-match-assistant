import { FetchLogLevel } from "@prisma/client";
import * as cheerio from "cheerio";

import { DiscoveryFetchError } from "@/lib/discovery/errors";
import type {
  DiscoveryFetchObserver,
  DiscoverySourceAdapter,
  DiscoverySourceRecord,
  FetchedSourceItem
} from "@/lib/discovery/types";

const BROWSER_LIKE_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
} as const;

function getHtmlConfig(source: DiscoverySourceRecord) {
  return (source.config ?? {}) as Record<string, unknown>;
}

function getMaxItems(source: DiscoverySourceRecord) {
  const config = getHtmlConfig(source);
  return Number(config.maxItems ?? 12);
}

function extractTextByLabel(pageText: string, label: string) {
  const expression = new RegExp(`${label}\\s+([^\\n]+)`, "i");
  return pageText.match(expression)?.[1]?.trim();
}

function normalizeEmployttListUrl(source: DiscoverySourceRecord, candidate?: string) {
  const defaultUrl = new URL("/jobs/list", source.baseUrl);
  const resolved = candidate ? new URL(candidate, source.baseUrl) : defaultUrl;

  if (resolved.pathname === "/jobs" || resolved.pathname === "/jobs/") {
    resolved.pathname = "/jobs/list";
  }

  return resolved.toString();
}

function resolveHtmlListUrl(source: DiscoverySourceRecord) {
  const config = getHtmlConfig(source);
  const configuredUrl =
    (typeof config.listUrl === "string" && config.listUrl) ||
    source.publicUrl ||
    (typeof config.listPath === "string" && config.listPath
      ? new URL(config.listPath, source.baseUrl).toString()
      : undefined);

  if (source.parserKey === "employtt-html") {
    return normalizeEmployttListUrl(source, configuredUrl);
  }

  return configuredUrl ? new URL(configuredUrl, source.baseUrl).toString() : source.baseUrl;
}

function buildFetchContext(params: {
  source: DiscoverySourceRecord;
  stage: "list-page" | "detail-page";
  requestUrl: string;
  requestMethod: "GET";
  responseStatus?: number;
}) {
  const context: Record<string, string | number> = {
    stage: params.stage,
    requestUrl: params.requestUrl,
    requestMethod: params.requestMethod,
    parserKey: params.source.parserKey,
    fetchStrategy: params.source.fetchStrategy,
    sourceName: params.source.name
  };

  if (typeof params.responseStatus === "number") {
    context.responseStatus = params.responseStatus;
  }

  return context;
}

async function logFetchIssue(params: {
  observer?: DiscoveryFetchObserver;
  source: DiscoverySourceRecord;
  stage: "list-page" | "detail-page";
  requestUrl: string;
  requestMethod: "GET";
  responseStatus?: number;
  message: string;
}) {
  await params.observer?.onLog?.({
    level: FetchLogLevel.ERROR,
    message: params.message,
    context: buildFetchContext(params)
  });
}

async function fetchHtmlDocument(params: {
  source: DiscoverySourceRecord;
  stage: "list-page" | "detail-page";
  url: string;
  observer?: DiscoveryFetchObserver;
  referer?: string;
}) {
  const requestMethod = "GET" as const;

  try {
    const response = await fetch(params.url, {
      method: requestMethod,
      headers: params.referer ? { ...BROWSER_LIKE_HEADERS, Referer: params.referer } : BROWSER_LIKE_HEADERS,
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const message = `HTML ${params.stage} fetch failed with status ${response.status}`;
      await logFetchIssue({
        observer: params.observer,
        source: params.source,
        stage: params.stage,
        requestUrl: params.url,
        requestMethod,
        responseStatus: response.status,
        message
      });

      throw new DiscoveryFetchError(message, {
        stage: params.stage,
        requestUrl: params.url,
        requestMethod,
        responseStatus: response.status,
        parserKey: params.source.parserKey,
        fetchStrategy: params.source.fetchStrategy,
        sourceName: params.source.name
      });
    }

    return response.text();
  } catch (error) {
    if (error instanceof DiscoveryFetchError) {
      throw error;
    }

    const message = `HTML ${params.stage} fetch failed before a response was received`;
    await logFetchIssue({
      observer: params.observer,
      source: params.source,
      stage: params.stage,
      requestUrl: params.url,
      requestMethod,
      message
    });

    throw new DiscoveryFetchError(
      message,
      {
        stage: params.stage,
        requestUrl: params.url,
        requestMethod,
        parserKey: params.source.parserKey,
        fetchStrategy: params.source.fetchStrategy,
        sourceName: params.source.name
      },
      { cause: error }
    );
  }
}

async function fetchEmployttJobDetails(params: {
  url: string;
  listUrl: string;
  source: DiscoverySourceRecord;
  observer?: DiscoveryFetchObserver;
}) {
  const html = await fetchHtmlDocument({
    source: params.source,
    stage: "detail-page",
    url: params.url,
    referer: params.listUrl,
    observer: params.observer
  });

  const $ = cheerio.load(html);
  const rawPageText = $.root().text();
  const pageText = rawPageText.replace(/\s+/g, " ").trim();
  const title = $("h1").first().text().trim() || extractTextByLabel(rawPageText, "Jobs Listing") || "Untitled role";
  const company =
    $("a[href*='/employers/']").first().text().trim() || $("h1").first().next().text().trim() || "Unknown company";
  const location =
    extractTextByLabel(rawPageText, "Work Location:") ??
    extractTextByLabel(rawPageText, "Work Location") ??
    "Trinidad and Tobago";
  const descriptionStart = pageText.indexOf("Job Description");
  const description = descriptionStart >= 0 ? pageText.slice(descriptionStart) : pageText;

  return {
    externalId: params.url.split("/").pop(),
    sourceUrl: params.url,
    applicationUrl: params.url,
    title,
    company,
    locationRaw: location,
    description,
    salaryRaw: extractTextByLabel(rawPageText, "Salary \\(Monthly\\)"),
    requirements: extractTextByLabel(rawPageText, "Qualifications and Experience"),
    employmentType: extractTextByLabel(rawPageText, "Type"),
    rawPayload: {
      html
    } as never,
    tags: [...params.source.defaultTags, ...params.source.regionTags, "html-discovered", "trinidad-and-tobago"]
  } satisfies FetchedSourceItem;
}

function extractEmployttDetailUrls(html: string, source: DiscoverySourceRecord) {
  const $ = cheerio.load(html);
  const maxItems = getMaxItems(source);

  return Array.from(
    new Set(
      $("a[href*='/jobs/view/']")
        .map((_, element) => new URL($(element).attr("href") ?? "/", source.baseUrl).toString())
        .get()
    )
  ).slice(0, maxItems);
}

export const htmlDiscoveryAdapter: DiscoverySourceAdapter = {
  type: "HTML",
  canHandle: (source) => source.sourceType === "HTML",
  async fetchItems(source, observer) {
    const listUrl = resolveHtmlListUrl(source);
    const html = await fetchHtmlDocument({
      source,
      stage: "list-page",
      url: listUrl,
      observer
    });

    const detailUrls = extractEmployttDetailUrls(html, source);

    if (!detailUrls.length && source.parserKey === "employtt-html") {
      const message = "No EmployTT job detail links were found on the public page.";
      await logFetchIssue({
        observer,
        source,
        stage: "list-page",
        requestUrl: listUrl,
        requestMethod: "GET",
        responseStatus: 200,
        message
      });

      throw new DiscoveryFetchError(message, {
        stage: "list-page",
        requestUrl: listUrl,
        requestMethod: "GET",
        responseStatus: 200,
        parserKey: source.parserKey,
        fetchStrategy: source.fetchStrategy,
        sourceName: source.name
      });
    }

    const items: FetchedSourceItem[] = [];

    for (const detailUrl of detailUrls) {
      try {
        items.push(
          await fetchEmployttJobDetails({
            url: detailUrl,
            listUrl,
            source,
            observer
          })
        );
      } catch (error) {
        if (!(error instanceof DiscoveryFetchError)) {
          const message = error instanceof Error ? error.message : "Unknown HTML detail fetch failure";
          await logFetchIssue({
            observer,
            source,
            stage: "detail-page",
            requestUrl: detailUrl,
            requestMethod: "GET",
            message
          });
        }
      }
    }

    if (!items.length && detailUrls.length) {
      throw new DiscoveryFetchError("EmployTT detail fetch failed for all discovered public job pages.", {
        stage: "detail-page",
        requestUrl: detailUrls[0] ?? listUrl,
        requestMethod: "GET",
        parserKey: source.parserKey,
        fetchStrategy: source.fetchStrategy,
        sourceName: source.name
      });
    }

    return items;
  }
};
