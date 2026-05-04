import { type JobSourceType, type Prisma, type SeniorityLevel, type WorkMode } from "@prisma/client";
import { parse as parseCsv } from "csv-parse/sync";
import Parser from "rss-parser";

import { prisma } from "@/lib/db/prisma";
import { recomputeJobMatchesForUser } from "@/lib/jobs/scoring";
import { manualJobSchema, rssImportSchema } from "@/lib/validations/jobs";
import { normalizeText, parseDelimitedList, sanitizeText, slugify, uniqueArray } from "@/lib/utils";

const rssParser = new Parser();

type JobInput = {
  sourceType: JobSourceType;
  sourceName: string;
  sourceReference?: string;
  title: string;
  company: string;
  location: string;
  workMode?: WorkMode;
  seniorityLevel?: SeniorityLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredYearsExperience?: number;
  educationRequirements?: string;
  keywords: string[];
  applicationUrl: string;
  postedAt?: Date;
  rawPayload?: Prisma.InputJsonValue;
};

function inferWorkMode(text: string): WorkMode | undefined {
  const normalized = normalizeText(text);
  if (normalized.includes("remote")) {
    return "REMOTE";
  }
  if (normalized.includes("hybrid")) {
    return "HYBRID";
  }
  if (normalized.includes("on-site") || normalized.includes("onsite")) {
    return "ONSITE";
  }
  return undefined;
}

function inferSeniority(text: string): SeniorityLevel | undefined {
  const normalized = normalizeText(text);
  if (normalized.includes("entry")) return "ENTRY";
  if (normalized.includes("junior")) return "JUNIOR";
  if (normalized.includes("mid")) return "MID";
  if (normalized.includes("senior")) return "SENIOR";
  if (normalized.includes("lead")) return "LEAD";
  if (normalized.includes("principal")) return "PRINCIPAL";
  return undefined;
}

function extractJobKeywords(text: string) {
  return uniqueArray(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((token) => token.length > 3)
      .slice(0, 18)
  );
}

function extractPossibleSkills(text: string) {
  const candidates = [
    "php",
    "laravel",
    "mysql",
    "postgres",
    "javascript",
    "typescript",
    "react",
    "node",
    "aws",
    "docker",
    "api",
    "sql",
    "python",
    "git",
    "css",
    "html"
  ];
  const normalized = normalizeText(text);
  return candidates
    .filter((candidate) => normalized.includes(candidate))
    .map((candidate) => candidate.toUpperCase() === "API" ? "API" : candidate[0].toUpperCase() + candidate.slice(1));
}

function buildJobId(job: Pick<JobInput, "company" | "title" | "sourceName">) {
  return slugify(`${job.company}-${job.title}-${job.sourceName}`);
}

async function persistJobs(userId: string, jobs: JobInput[]) {
  const importedIds: string[] = [];

  for (const job of jobs) {
    const id = buildJobId(job);
    importedIds.push(id);

    await prisma.job.upsert({
      where: { id },
      update: {
        ...job
      },
      create: {
        id,
        ...job
      }
    });
  }

  await recomputeJobMatchesForUser(userId, importedIds);

  return importedIds;
}

export async function importManualJob(userId: string, input: Record<string, unknown>) {
  const parsed = manualJobSchema.parse(input);

  return persistJobs(userId, [
    {
      sourceType: parsed.sourceType,
      sourceName: parsed.sourceName,
      sourceReference: parsed.sourceReference,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      workMode: parsed.workMode,
      seniorityLevel: parsed.seniorityLevel,
      salaryMin: parsed.salaryMin,
      salaryMax: parsed.salaryMax,
      salaryCurrency: parsed.salaryCurrency,
      description: parsed.description,
      requiredSkills: parseDelimitedList(parsed.requiredSkills),
      preferredSkills: parseDelimitedList(parsed.preferredSkills),
      requiredYearsExperience: parsed.requiredYearsExperience,
      educationRequirements: parsed.educationRequirements,
      keywords: parseDelimitedList(parsed.keywords),
      applicationUrl: parsed.applicationUrl,
      postedAt: parsed.postedAt ? new Date(parsed.postedAt) : undefined,
      rawPayload: parsed
    }
  ]);
}

export async function importJobsFromCsv(userId: string, csvText: string, sourceName = "CSV Import") {
  const rows = parseCsv(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  const jobs = rows.map((row) => {
    const description = row.description || row.summary || "";
    const combinedText = `${row.title ?? ""} ${description}`;

    return {
      sourceType: "CSV_IMPORT" as const,
      sourceName,
      sourceReference: row.sourceReference ?? row.url,
      title: sanitizeText(row.title ?? "Untitled role"),
      company: sanitizeText(row.company ?? "Unknown company"),
      location: sanitizeText(row.location ?? "Not specified"),
      workMode: (row.workMode?.toUpperCase() as WorkMode | undefined) ?? inferWorkMode(combinedText),
      seniorityLevel:
        (row.seniorityLevel?.toUpperCase() as SeniorityLevel | undefined) ?? inferSeniority(combinedText),
      salaryMin: row.salaryMin ? Number.parseInt(row.salaryMin, 10) : undefined,
      salaryMax: row.salaryMax ? Number.parseInt(row.salaryMax, 10) : undefined,
      salaryCurrency: sanitizeText(row.salaryCurrency ?? "USD"),
      description,
      requiredSkills: parseDelimitedList(row.requiredSkills ?? row.skills ?? ""),
      preferredSkills: parseDelimitedList(row.preferredSkills ?? ""),
      requiredYearsExperience: row.requiredYearsExperience
        ? Number.parseInt(row.requiredYearsExperience, 10)
        : undefined,
      educationRequirements: sanitizeText(row.educationRequirements ?? ""),
      keywords: parseDelimitedList(row.keywords ?? ""),
      applicationUrl: row.applicationUrl ?? row.url ?? "",
      postedAt: row.postedAt ? new Date(row.postedAt) : undefined,
      rawPayload: row
    };
  });

  return persistJobs(userId, jobs.filter((job) => job.title && job.company && job.applicationUrl));
}

export async function importJobsFromRss(userId: string, input: Record<string, unknown>) {
  const parsed = rssImportSchema.parse(input);
  const feed = await rssParser.parseURL(parsed.feedUrl);

  const jobs: JobInput[] = (feed.items ?? [])
    .slice(0, 25)
    .map((item) => {
      const title = sanitizeText(item.title ?? "Untitled role");
      const content = sanitizeText(item.contentSnippet ?? item.content ?? item.summary ?? "");
      const companyCandidate = sanitizeText(item.creator ?? feed.title ?? parsed.sourceName);
      const text = `${title} ${content}`;

      return {
        sourceType: "RSS_FEED" as const,
        sourceName: parsed.sourceName,
        sourceReference: parsed.feedUrl,
        title,
        company: companyCandidate || "Unknown company",
        location: content.match(/remote|hybrid|on[- ]site/i) ? content.match(/remote|hybrid|on[- ]site/i)?.[0] ?? "Not specified" : "Not specified",
        workMode: inferWorkMode(text),
        seniorityLevel: inferSeniority(text),
        description: content,
        requiredSkills: extractPossibleSkills(text),
        preferredSkills: [],
        keywords: extractJobKeywords(text),
        applicationUrl: item.link ?? parsed.feedUrl,
        postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        rawPayload: item as Prisma.InputJsonValue
      };
    })
    .filter((job) => job.applicationUrl);

  return persistJobs(userId, jobs);
}
