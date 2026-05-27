import { createHash } from "crypto";
import { decode } from "he";
import { SeniorityLevel, WorkMode, type DiscoverySourceType } from "@prisma/client";

import { normalizeDiscoveryLocation } from "@/lib/discovery/location";
import type { FetchedSourceItem, NormalizedDiscoveredJob } from "@/lib/discovery/types";
import { normalizeText, sanitizeText, slugify, uniqueArray } from "@/lib/utils";

function decodeAndSanitize(value?: string | null) {
  if (!value) {
    return "";
  }

  return sanitizeText(decode(value));
}

function detectWorkMode(text: string, hintedMode?: WorkMode) {
  if (hintedMode) {
    return hintedMode;
  }

  const normalized = normalizeText(text);

  if (normalized.includes("remote")) {
    return WorkMode.REMOTE;
  }

  if (normalized.includes("hybrid")) {
    return WorkMode.HYBRID;
  }

  if (normalized.includes("onsite") || normalized.includes("on-site")) {
    return WorkMode.ONSITE;
  }

  return undefined;
}

function detectSeniority(text: string, hintedLevel?: SeniorityLevel) {
  if (hintedLevel) {
    return hintedLevel;
  }

  const normalized = normalizeText(text);

  if (normalized.includes("entry")) return SeniorityLevel.ENTRY;
  if (normalized.includes("junior")) return SeniorityLevel.JUNIOR;
  if (normalized.includes("mid")) return SeniorityLevel.MID;
  if (normalized.includes("senior")) return SeniorityLevel.SENIOR;
  if (normalized.includes("lead")) return SeniorityLevel.LEAD;
  if (normalized.includes("principal")) return SeniorityLevel.PRINCIPAL;

  return undefined;
}

function detectEmploymentType(text: string, hintedType?: string) {
  if (hintedType) {
    return hintedType;
  }

  const normalized = normalizeText(text);

  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("part-time")) return "Part-time";
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("temporary")) return "Temporary";
  if (normalized.includes("full-time")) return "Full-time";

  return undefined;
}

function extractSalaryParts(value?: string) {
  if (!value) {
    return {
      salaryRaw: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      currency: undefined
    };
  }

  const raw = decodeAndSanitize(value);
  const numbers: number[] = [];

  for (const salaryMatch of raw.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/gi)) {
    const amount = Number.parseFloat(salaryMatch[1].replaceAll(",", ""));
    const multiplier = salaryMatch[2]?.toLowerCase() === "m" ? 1_000_000 : salaryMatch[2]?.toLowerCase() === "k" ? 1_000 : 1;

    if (amount >= 1) {
      numbers.push(Math.round(amount * multiplier));
    }
  }

  const currency = /tt\$|ttd/i.test(raw)
    ? "TTD"
    : /€|eur/i.test(raw)
      ? "EUR"
      : /£|gbp/i.test(raw)
        ? "GBP"
        : /cad/i.test(raw)
          ? "CAD"
          : /\$|usd/i.test(raw)
            ? "USD"
            : undefined;

  return {
    salaryRaw: raw,
    salaryMin: numbers[0],
    salaryMax: numbers[1] ?? numbers[0],
    currency
  };
}

function normalizeUrlForDedupe(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    const keptParams = new URLSearchParams();

    for (const [key, paramValue] of url.searchParams) {
      if (!key.toLowerCase().startsWith("utm_")) {
        keptParams.set(key, paramValue);
      }
    }

    url.hash = "";
    url.search = keptParams.toString();

    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
  }
}

function extractRequirements(description: string, hintedRequirements?: string) {
  if (hintedRequirements) {
    return decodeAndSanitize(hintedRequirements);
  }

  const match = description.match(/(requirements|qualifications)[:\s]+(.+)/i);
  return match ? decodeAndSanitize(match[2]) : undefined;
}

function buildNormalizedHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function buildDedupeKey({
  applicationUrl,
  sourceUrl,
  company,
  title,
  locationSlug
}: {
  applicationUrl?: string;
  sourceUrl: string;
  company: string;
  title: string;
  locationSlug: string;
}) {
  const normalizedApplicationUrl = normalizeUrlForDedupe(applicationUrl);
  const normalizedSourceUrl = normalizeUrlForDedupe(sourceUrl);

  if (normalizedApplicationUrl) {
    return `application:${normalizedApplicationUrl}`;
  }

  if (normalizedSourceUrl) {
    return `source:${normalizedSourceUrl}`;
  }

  return `canonical:${slugify(company)}:${slugify(title)}:${locationSlug}`;
}

function deriveTags(item: FetchedSourceItem, locationLabel: ReturnType<typeof normalizeDiscoveryLocation>) {
  const baseTags = item.tags ?? [];
  const derived = [
    locationLabel.isTrinidadAndTobago ? "trinidad-and-tobago" : null,
    locationLabel.isCaribbean ? "caribbean" : null,
    locationLabel.isRemoteFriendly ? "remote-friendly" : null
  ].filter((tag): tag is string => Boolean(tag));

  return uniqueArray([...baseTags, ...derived]);
}

export function normalizeFetchedItem(
  sourceType: DiscoverySourceType,
  sourceName: string,
  item: FetchedSourceItem
): NormalizedDiscoveredJob {
  const description = decodeAndSanitize(item.description);
  const location = normalizeDiscoveryLocation(item.locationRaw);
  const textForInference = `${item.title} ${description} ${item.locationRaw}`;
  const salary = extractSalaryParts(item.salaryRaw);

  return {
    sourceType,
    sourceName,
    sourceUrl: item.sourceUrl,
    applicationUrl: item.applicationUrl,
    externalId: item.externalId,
    title: decodeAndSanitize(item.title),
    company: decodeAndSanitize(item.company),
    locationRaw: item.locationRaw,
    locationText: location.normalizedValue,
    country: location.country,
    cityRegion: location.city ?? location.region,
    remoteStatus: detectWorkMode(textForInference, item.workMode),
    isRemoteFriendly: location.isRemoteFriendly,
    isTrinidadAndTobago: location.isTrinidadAndTobago,
    isCaribbeanFriendly: location.isCaribbean,
    salaryRaw: salary.salaryRaw,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    description,
    requirements: extractRequirements(description, item.requirements),
    employmentType: detectEmploymentType(textForInference, item.employmentType),
    experienceLevel: detectSeniority(textForInference, item.experienceLevel),
    postedAt: item.postedAt ?? null,
    discoveredAt: new Date(),
    dedupeKey: buildDedupeKey({
      applicationUrl: item.applicationUrl,
      sourceUrl: item.sourceUrl,
      company: item.company,
      title: item.title,
      locationSlug: location.slug
    }),
    normalizedHash: buildNormalizedHash(
      `${normalizeText(item.company)}|${normalizeText(item.title)}|${normalizeText(description.slice(0, 600))}`
    ),
    tags: deriveTags(item, location),
    location
  };
}
