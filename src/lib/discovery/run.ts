import {
  DiscoveryImportStatus,
  DiscoverySourceType,
  FetchLogLevel,
  JobSourceType,
  type Prisma
} from "@prisma/client";

import { isDiscoveryFetchError } from "@/lib/discovery/errors";
import { resolveDedupeGroup } from "@/lib/discovery/dedupe";
import { normalizeFetchedItem } from "@/lib/discovery/normalize";
import { resolveDiscoveryAdapter } from "@/lib/discovery/registry";
import type { DiscoverySourceRecord, NormalizedDiscoveredJob, SourceExecutionSummary } from "@/lib/discovery/types";
import { prisma } from "@/lib/db/prisma";
import { recomputeJobMatchesForAllUsers } from "@/lib/jobs/scoring";
import { normalizeText, uniqueArray } from "@/lib/utils";

function mapDiscoverySourceTypeToJobSourceType(type: DiscoverySourceType) {
  switch (type) {
    case "RSS":
      return JobSourceType.RSS_FEED;
    case "API":
      return JobSourceType.OFFICIAL_API;
    case "HTML":
      return JobSourceType.HTML_DISCOVERY;
    case "CSV":
      return JobSourceType.CSV_IMPORT;
    case "MANUAL":
      return JobSourceType.MANUAL_TEXT;
    default:
      return JobSourceType.MANUAL_TEXT;
  }
}

function extractPossibleSkills(text: string) {
  const candidates = [
    "ai",
    "agentic",
    "analytics",
    "api",
    "aws",
    "azure",
    "cloud",
    "customer service",
    "data",
    "docker",
    "fastapi",
    "finance",
    "figma",
    "gcp",
    "git",
    "graphql",
    "javascript",
    "kubernetes",
    "laravel",
    "llm",
    "machine learning",
    "mysql",
    "next.js",
    "node",
    "postgres",
    "postgresql",
    "php",
    "prisma",
    "product management",
    "project management",
    "python",
    "react",
    "redis",
    "rest",
    "saas",
    "sql",
    "supabase",
    "tailwind",
    "terraform",
    "typescript",
    "ux"
  ];
  const normalized = normalizeText(text);
  return uniqueArray(
    candidates
      .filter((candidate) => {
        const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalized);
      })
      .map((candidate) =>
        candidate
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      )
  );
}

function jobTagCategory(tag: string) {
  const normalized = tag.toLowerCase();

  if (normalized.includes("trinidad") || normalized.includes("caribbean")) return "region";
  if (normalized.includes("remote")) return "work-mode";
  if (["high-quality", "startup-source", "needs-review", "regional-source"].includes(normalized)) return "quality";

  return "source";
}

function inferEducationRequirements(text: string) {
  const normalized = normalizeText(text);

  if (normalized.includes("bachelor") || normalized.includes("degree")) {
    return "Bachelor's degree or equivalent experience";
  }

  if (normalized.includes("cxc") || normalized.includes("csec")) {
    return "Secondary school qualifications required";
  }

  return undefined;
}

async function writeFetchLog(data: Prisma.FetchLogUncheckedCreateInput) {
  await prisma.fetchLog.create({ data });
}

async function writeSourceError(data: Prisma.SourceErrorUncheckedCreateInput) {
  await prisma.sourceError.create({ data });
}

function extractSourceErrorDetails(error: unknown) {
  if (isDiscoveryFetchError(error)) {
    const details: Record<string, string | number> = {
      stage: error.metadata.stage,
      requestUrl: error.metadata.requestUrl,
      requestMethod: error.metadata.requestMethod,
      parserKey: error.metadata.parserKey ?? "",
      fetchStrategy: error.metadata.fetchStrategy ?? "",
      sourceName: error.metadata.sourceName ?? ""
    };

    if (typeof error.metadata.responseStatus === "number") {
      details.responseStatus = error.metadata.responseStatus;
    }

    return details satisfies Prisma.InputJsonValue;
  }

  return undefined;
}

async function upsertNormalizedLocation(tx: Prisma.TransactionClient, normalized: NormalizedDiscoveredJob) {
  return tx.jobLocationNormalized.upsert({
    where: {
      slug: normalized.location.slug
    },
    update: {
      rawValue: normalized.location.rawValue,
      normalizedValue: normalized.location.normalizedValue,
      country: normalized.location.country,
      region: normalized.location.region,
      city: normalized.location.city,
      scope: normalized.location.scope,
      isRemoteFriendly: normalized.location.isRemoteFriendly,
      isTrinidadAndTobago: normalized.location.isTrinidadAndTobago,
      isCaribbean: normalized.location.isCaribbean,
      aliases: normalized.location.aliases
    },
    create: {
      slug: normalized.location.slug,
      rawValue: normalized.location.rawValue,
      normalizedValue: normalized.location.normalizedValue,
      country: normalized.location.country,
      region: normalized.location.region,
      city: normalized.location.city,
      scope: normalized.location.scope,
      isRemoteFriendly: normalized.location.isRemoteFriendly,
      isTrinidadAndTobago: normalized.location.isTrinidadAndTobago,
      isCaribbean: normalized.location.isCaribbean,
      aliases: normalized.location.aliases
    }
  });
}

async function materializeCanonicalJob(params: {
  tx: Prisma.TransactionClient;
  source: DiscoverySourceRecord;
  normalized: NormalizedDiscoveredJob;
  locationId: string;
  dedupeGroupId: string;
}) {
  const existingGroup = await params.tx.dedupeGroup.findUnique({
    where: {
      id: params.dedupeGroupId
    },
    include: {
      canonicalJob: true
    }
  });

  const existingJob =
    existingGroup?.canonicalJob ??
    (await params.tx.job.findUnique({
      where: {
        dedupeGroupId: params.dedupeGroupId
      }
    }));

  const jobData: Prisma.JobUncheckedCreateInput = {
    sourceType: mapDiscoverySourceTypeToJobSourceType(params.source.sourceType),
    sourceName: params.source.name,
    sourceReference: params.normalized.sourceUrl,
    title: params.normalized.title,
    company: params.normalized.company,
    location: params.normalized.locationText,
    locationRaw: params.normalized.locationRaw,
    locationNormalizedId: params.locationId,
    country: params.normalized.country,
    cityRegion: params.normalized.cityRegion,
    workMode: params.normalized.remoteStatus,
    isRemoteFriendly: params.normalized.isRemoteFriendly,
    isTrinidadAndTobago: params.normalized.isTrinidadAndTobago,
    isCaribbeanFriendlyRemote: params.normalized.isCaribbeanFriendly,
    seniorityLevel: params.normalized.experienceLevel,
    salaryRaw: params.normalized.salaryRaw,
    salaryMin: params.normalized.salaryMin,
    salaryMax: params.normalized.salaryMax,
    salaryCurrency: params.normalized.currency,
    description: params.normalized.description,
    requirements: params.normalized.requirements,
    employmentType: params.normalized.employmentType,
    requiredSkills: extractPossibleSkills(params.normalized.description),
    preferredSkills: [],
    requiredYearsExperience: undefined,
    educationRequirements: inferEducationRequirements(params.normalized.description),
    keywords: params.normalized.tags,
    applicationUrl: params.normalized.applicationUrl ?? params.normalized.sourceUrl,
    postedAt: params.normalized.postedAt ?? undefined,
    discoveredAt: existingJob?.discoveredAt ?? params.normalized.discoveredAt,
    lastSeenAt: new Date(),
    isDiscoveredAutomatically: true,
    needsReview: true,
    discoveryTrustWeight:
      params.source.sourceType === "API" ? 1 : params.source.sourceType === "HTML" ? 0.97 : 0.92,
    discoverySourceId: params.source.id,
    dedupeGroupId: params.dedupeGroupId,
    rawPayload: {
      sourceType: params.normalized.sourceType,
      sourceName: params.normalized.sourceName,
      sourceUrl: params.normalized.sourceUrl,
      applicationUrl: params.normalized.applicationUrl,
      externalId: params.normalized.externalId,
      normalizedHash: params.normalized.normalizedHash,
      tags: params.normalized.tags
    }
  };

  const job = existingJob
    ? await params.tx.job.update({
        where: { id: existingJob.id },
        data: jobData
      })
    : await params.tx.job.create({
        data: jobData
      });

  await params.tx.jobTag.deleteMany({
    where: {
      jobId: job.id
    }
  });

  if (params.normalized.tags.length) {
    await params.tx.jobTag.createMany({
      data: params.normalized.tags.map((tag) => ({
        jobId: job.id,
        sourceId: params.source.id,
        label: tag,
        category: jobTagCategory(tag)
      }))
    });
  }

  return job;
}

async function processNormalizedItem(params: {
  source: DiscoverySourceRecord;
  runId: string;
  normalized: NormalizedDiscoveredJob;
  rawJobId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const location = await upsertNormalizedLocation(tx, params.normalized);
    const dedupe = await resolveDedupeGroup(tx, params.normalized);

    const existingNormalized = await tx.discoveredJobNormalized.findUnique({
      where: {
        sourceId_sourceUrl: {
          sourceId: params.source.id,
          sourceUrl: params.normalized.sourceUrl
        }
      }
    });

    const job = await materializeCanonicalJob({
      tx,
      source: params.source,
      normalized: params.normalized,
      locationId: location.id,
      dedupeGroupId: dedupe.group.id
    });

    const discoveryRecord = existingNormalized
      ? await tx.discoveredJobNormalized.update({
          where: { id: existingNormalized.id },
          data: {
            sourceRunId: params.runId,
            rawJobId: params.rawJobId,
            dedupeGroupId: dedupe.group.id,
            canonicalJobId: job.id,
            locationNormalizedId: location.id,
            sourceType: params.normalized.sourceType,
            sourceName: params.normalized.sourceName,
            applicationUrl: params.normalized.applicationUrl,
            externalId: params.normalized.externalId,
            title: params.normalized.title,
            company: params.normalized.company,
            locationRaw: params.normalized.locationRaw,
            locationText: params.normalized.locationText,
            country: params.normalized.country,
            cityRegion: params.normalized.cityRegion,
            remoteStatus: params.normalized.remoteStatus,
            isRemoteFriendly: params.normalized.isRemoteFriendly,
            isTrinidadAndTobago: params.normalized.isTrinidadAndTobago,
            isCaribbeanFriendly: params.normalized.isCaribbeanFriendly,
            salaryRaw: params.normalized.salaryRaw,
            salaryMin: params.normalized.salaryMin,
            salaryMax: params.normalized.salaryMax,
            currency: params.normalized.currency,
            description: params.normalized.description,
            requirements: params.normalized.requirements,
            employmentType: params.normalized.employmentType,
            experienceLevel: params.normalized.experienceLevel,
            postedAt: params.normalized.postedAt ?? undefined,
            discoveredAt: params.normalized.discoveredAt,
            importStatus: dedupe.isLikelyDuplicate ? DiscoveryImportStatus.DUPLICATE : DiscoveryImportStatus.UPDATED,
            dedupeKey: params.normalized.dedupeKey,
            normalizedHash: params.normalized.normalizedHash,
            similarityScore: dedupe.similarityScore
          }
        })
      : await tx.discoveredJobNormalized.create({
          data: {
            sourceId: params.source.id,
            sourceRunId: params.runId,
            rawJobId: params.rawJobId,
            dedupeGroupId: dedupe.group.id,
            canonicalJobId: job.id,
            locationNormalizedId: location.id,
            sourceType: params.normalized.sourceType,
            sourceName: params.normalized.sourceName,
            sourceUrl: params.normalized.sourceUrl,
            applicationUrl: params.normalized.applicationUrl,
            externalId: params.normalized.externalId,
            title: params.normalized.title,
            company: params.normalized.company,
            locationRaw: params.normalized.locationRaw,
            locationText: params.normalized.locationText,
            country: params.normalized.country,
            cityRegion: params.normalized.cityRegion,
            remoteStatus: params.normalized.remoteStatus,
            isRemoteFriendly: params.normalized.isRemoteFriendly,
            isTrinidadAndTobago: params.normalized.isTrinidadAndTobago,
            isCaribbeanFriendly: params.normalized.isCaribbeanFriendly,
            salaryRaw: params.normalized.salaryRaw,
            salaryMin: params.normalized.salaryMin,
            salaryMax: params.normalized.salaryMax,
            currency: params.normalized.currency,
            description: params.normalized.description,
            requirements: params.normalized.requirements,
            employmentType: params.normalized.employmentType,
            experienceLevel: params.normalized.experienceLevel,
            postedAt: params.normalized.postedAt ?? undefined,
            discoveredAt: params.normalized.discoveredAt,
            importStatus: dedupe.isLikelyDuplicate ? DiscoveryImportStatus.DUPLICATE : DiscoveryImportStatus.IMPORTED,
            dedupeKey: params.normalized.dedupeKey,
            normalizedHash: params.normalized.normalizedHash,
            similarityScore: dedupe.similarityScore
          }
        });

    await tx.jobTag.deleteMany({
      where: {
        discoveredJobId: discoveryRecord.id
      }
    });

    if (params.normalized.tags.length) {
      await tx.jobTag.createMany({
        data: params.normalized.tags.map((tag) => ({
            discoveredJobId: discoveryRecord.id,
            sourceId: params.source.id,
            label: tag,
            category: jobTagCategory(tag)
          }))
      });
    }

    await tx.dedupeGroup.update({
      where: { id: dedupe.group.id },
      data: {
        canonicalNormalizedJobId: discoveryRecord.id
      }
    });

    return {
      isDuplicate: dedupe.isLikelyDuplicate,
      jobId: job.id,
      discoveryRecordId: discoveryRecord.id,
      dedupeReason: dedupe.reason
    };
  });
}

export async function runDiscoveryForSource(sourceId: string, triggeredByUserId?: string | null) {
  const source = await prisma.discoverySource.findUnique({
    where: { id: sourceId },
    include: { settings: true }
  });

  if (!source) {
    throw new Error("Discovery source not found.");
  }

  if (!source.enabled) {
    throw new Error("Discovery source is disabled.");
  }

  const run = await prisma.sourceRun.create({
    data: {
      sourceId,
      triggeredByUserId: triggeredByUserId ?? undefined,
      triggerMode: triggeredByUserId ? "MANUAL" : "API",
      status: "RUNNING"
    }
  });

  const summary: SourceExecutionSummary = {
    jobsFound: 0,
    jobsImported: 0,
    duplicatesSkipped: 0,
    parsingFailures: 0,
    runtimeErrors: 0,
    canonicalJobIds: []
  };
  let adapterRuntimeErrors = 0;

  try {
    const adapter = resolveDiscoveryAdapter(source);
    const fetchedItems = await adapter.fetchItems(source, {
      onLog: async (entry) => {
        if (entry.level === FetchLogLevel.ERROR) {
          adapterRuntimeErrors += 1;
        }

        await writeFetchLog({
          sourceId,
          sourceRunId: run.id,
          level: entry.level,
          message: entry.message,
          context: entry.context
        });
      }
    });
    summary.jobsFound = fetchedItems.length;
    summary.runtimeErrors += adapterRuntimeErrors;

    await writeFetchLog({
      sourceId,
      sourceRunId: run.id,
      level: FetchLogLevel.INFO,
      message: `Fetched ${fetchedItems.length} candidate items from ${source.name}.`
    });

    for (const item of fetchedItems) {
      try {
        const rawJob = await prisma.discoveredJobRaw.create({
          data: {
            sourceId,
            sourceRunId: run.id,
            externalId: item.externalId,
            sourceUrl: item.sourceUrl,
            sourceType: source.sourceType,
            payload: item.rawPayload,
            rawText: item.rawText,
            fingerprint: `${item.externalId ?? item.sourceUrl}:${item.title}`,
            parseStatus: "NEW"
          }
        });

        const normalized = normalizeFetchedItem(source.sourceType, source.name, item);
        const processed = await processNormalizedItem({
          source,
          runId: run.id,
          normalized,
          rawJobId: rawJob.id
        });

        summary.canonicalJobIds.push(processed.jobId);

        if (processed.isDuplicate) {
          summary.duplicatesSkipped += 1;
        } else {
          summary.jobsImported += 1;
        }

        await writeFetchLog({
          sourceId,
          sourceRunId: run.id,
          discoveredJobId: processed.discoveryRecordId,
          level: FetchLogLevel.INFO,
          message: processed.isDuplicate
            ? `Grouped duplicate listing for ${normalized.title}.`
            : `Imported discovered job ${normalized.title}.`,
          context: {
            dedupeReason: processed.dedupeReason,
            canonicalJobId: processed.jobId
          }
        });
      } catch (error) {
        summary.parsingFailures += 1;

        await writeSourceError({
          sourceId,
          sourceRunId: run.id,
          message: error instanceof Error ? error.message : "Unknown parsing failure",
          details: {
            sourceUrl: item.sourceUrl,
            title: item.title
          }
        });
      }
    }

    const uniqueJobIds = Array.from(new Set(summary.canonicalJobIds));
    if (uniqueJobIds.length) {
      await recomputeJobMatchesForAllUsers(uniqueJobIds);
    }

    await prisma.sourceRun.update({
      where: { id: run.id },
      data: {
        status: summary.runtimeErrors || summary.parsingFailures ? "PARTIAL" : "SUCCESS",
        finishedAt: new Date(),
        jobsFound: summary.jobsFound,
        jobsImported: summary.jobsImported,
        duplicatesSkipped: summary.duplicatesSkipped,
        parsingFailures: summary.parsingFailures,
        runtimeErrors: summary.runtimeErrors,
        summary
      }
    });

    await prisma.discoverySource.update({
      where: { id: sourceId },
      data: {
        lastRunAt: new Date(),
        lastSuccessAt: new Date(),
        lastStatus: summary.runtimeErrors || summary.parsingFailures ? "PARTIAL" : "SUCCESS",
        healthStatus: "HEALTHY",
        lastMessage: `Imported ${summary.jobsImported}, duplicates ${summary.duplicatesSkipped}.`
      }
    });

    return summary;
  } catch (error) {
    if (!summary.runtimeErrors) {
      summary.runtimeErrors = adapterRuntimeErrors || 1;
    }

    const details = extractSourceErrorDetails(error);

    await prisma.sourceRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        runtimeErrors: summary.runtimeErrors,
        summary
      }
    });

    await prisma.discoverySource.update({
      where: { id: sourceId },
      data: {
        lastRunAt: new Date(),
        lastStatus: "FAILED",
        healthStatus: "ERROR",
        lastMessage: error instanceof Error ? error.message : "Unknown discovery failure"
      }
    });

    await writeSourceError({
      sourceId,
      sourceRunId: run.id,
      code: "runtime_failure",
      message: error instanceof Error ? error.message : "Unknown discovery failure",
      details
    });

    throw error;
  }
}

export async function runAllEnabledSources(triggeredByUserId?: string | null) {
  const sources = await prisma.discoverySource.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
    include: { settings: true }
  });

  const results = [];

  for (const source of sources) {
    try {
      const summary = await runDiscoveryForSource(source.id, triggeredByUserId);
      results.push({ sourceId: source.id, status: "success", summary });
    } catch (error) {
      results.push({
        sourceId: source.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown discovery failure"
      });
    }
  }

  return results;
}
