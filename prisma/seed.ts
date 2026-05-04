import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { recomputeJobMatchesForUser } from "../src/lib/jobs/scoring";

const prisma = new PrismaClient();
const NOW = new Date("2026-04-14T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tagCategory = (tag: string) =>
  tag.includes("trinidad") || tag.includes("caribbean") ? "region" : tag.includes("remote") ? "work-mode" : "source";

async function syncJobTags(jobId: string, sourceId: string, tags: string[]) {
  await prisma.jobTag.deleteMany({ where: { jobId } });
  if (!tags.length) return;
  await prisma.jobTag.createMany({
    data: tags.map((tag) => ({ jobId, sourceId, label: tag, category: tagCategory(tag) }))
  });
}

async function syncDiscoveredTags(discoveredJobId: string, sourceId: string, tags: string[]) {
  await prisma.jobTag.deleteMany({ where: { discoveredJobId } });
  if (!tags.length) return;
  await prisma.jobTag.createMany({
    data: tags.map((tag) => ({ discoveredJobId, sourceId, label: tag, category: tagCategory(tag) }))
  });
}

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@jobmatchassistant.dev";
  const password = process.env.DEMO_USER_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName: "Demo Candidate", passwordHash, yearsExperience: 4, onboardingComplete: true },
    create: { email, fullName: "Demo Candidate", passwordHash, yearsExperience: 4, onboardingComplete: true }
  });

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      desiredJobTitles: ["Software Engineer", "Full-Stack Developer", "Platform Engineer"],
      preferredIndustries: ["Software", "SaaS", "FinTech"],
      preferredLocations: ["Trinidad and Tobago", "Port of Spain", "Remote"],
      workModes: ["REMOTE", "HYBRID"],
      minimumSalary: 60000,
      seniorityLevels: ["JUNIOR", "MID"],
      topSkills: ["TypeScript", "React", "Node.js", "PostgreSQL", "PHP", "Laravel"],
      certifications: ["AWS Cloud Practitioner"],
      degree: "BSc Computer Science",
      includeKeywords: ["typescript", "sql", "api", "remote"],
      excludeKeywords: ["clearance", "onsite-only"],
      targetCompanies: ["Island Commerce Ltd", "Remote Stack Co", "Stripe"],
      avoidCompanies: ["Example Corp"],
      prioritizeTrinidad: true,
      allowCaribbeanRemote: true,
      autoHideEnabled: false
    },
    create: {
      userId: user.id,
      desiredJobTitles: ["Software Engineer", "Full-Stack Developer", "Platform Engineer"],
      preferredIndustries: ["Software", "SaaS", "FinTech"],
      preferredLocations: ["Trinidad and Tobago", "Port of Spain", "Remote"],
      workModes: ["REMOTE", "HYBRID"],
      minimumSalary: 60000,
      seniorityLevels: ["JUNIOR", "MID"],
      topSkills: ["TypeScript", "React", "Node.js", "PostgreSQL", "PHP", "Laravel"],
      certifications: ["AWS Cloud Practitioner"],
      degree: "BSc Computer Science",
      includeKeywords: ["typescript", "sql", "api", "remote"],
      excludeKeywords: ["clearance", "onsite-only"],
      targetCompanies: ["Island Commerce Ltd", "Remote Stack Co", "Stripe"],
      avoidCompanies: ["Example Corp"],
      prioritizeTrinidad: true,
      allowCaribbeanRemote: true,
      autoHideEnabled: false
    }
  });

  await prisma.scoringSetting.upsert({
    where: { userId: user.id },
    update: { trinidadBoostWeight: 12, sourceTrustWeight: 6 },
    create: { userId: user.id, trinidadBoostWeight: 12, sourceTrustWeight: 6 }
  });

  const sources = [
    {
      id: "source-employtt-public",
      slug: "employtt-public-jobs",
      name: "EmployTT Public Jobs",
      sourceType: "HTML" as const,
      baseUrl: "https://employtt.gov.tt",
      publicUrl: "https://employtt.gov.tt/jobs/list",
      fetchStrategy: "public-html-polling",
      parserKey: "employtt-html",
      legalNotes:
        "Publicly accessible EmployTT listings only. No login, no form submission, and retrieval must remain read-only with conservative polling.",
      defaultTags: ["public", "trinidad-and-tobago"],
      regionTags: ["trinidad-and-tobago"],
      pollingIntervalMinutes: 360,
      dedupeStrategy: "canonical_url_or_company_title_location",
      config: { listPath: "/jobs/list", maxItems: 8 },
      enabled: true,
      lastRunAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
      lastSuccessAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
      lastStatus: "SUCCESS" as const,
      healthStatus: "HEALTHY" as const,
      lastMessage: "Imported 1 Trinidad-focused job from the public listing."
    },
    {
      id: "source-we-work-remotely",
      slug: "we-work-remotely-rss",
      name: "We Work Remotely RSS",
      sourceType: "RSS" as const,
      baseUrl: "https://weworkremotely.com",
      publicUrl: "https://weworkremotely.com/remote-job-rss-feed",
      fetchStrategy: "public-rss-polling",
      parserKey: "generic-rss",
      legalNotes:
        "Use the public RSS feed only. Do not browse protected areas or automate applications. Retain the original job URL for manual review.",
      defaultTags: ["remote", "rss"],
      regionTags: ["caribbean"],
      pollingIntervalMinutes: 180,
      dedupeStrategy: "canonical_url_or_company_title_location",
      config: { feedUrl: "https://weworkremotely.com/remote-job-rss-feed", maxItems: 15 },
      enabled: true,
      lastRunAt: new Date(NOW.getTime() - DAY),
      lastSuccessAt: new Date(NOW.getTime() - DAY),
      lastStatus: "SUCCESS" as const,
      healthStatus: "HEALTHY" as const,
      lastMessage: "Imported 1 remote role and established a canonical dedupe group."
    },
    {
      id: "source-remote-first-jobs",
      slug: "remote-first-jobs-api",
      name: "Remote First Jobs API",
      sourceType: "API" as const,
      baseUrl: "https://remotefirstjobs.com",
      publicUrl: "https://jobscollider.com/remote-jobs-api",
      fetchStrategy: "public-api-polling",
      parserKey: "remote-first-jobs-api",
      legalNotes:
        "Use the documented public API endpoint only. Keep requests within the published contract and retain source URLs for manual application review.",
      defaultTags: ["remote", "api"],
      regionTags: ["caribbean"],
      pollingIntervalMinutes: 240,
      dedupeStrategy: "canonical_url_or_company_title_location",
      config: { endpointPath: "/api/search-jobs", query: "platform engineer" },
      enabled: true,
      lastRunAt: new Date(NOW.getTime() - 6 * 60 * 60 * 1000),
      lastSuccessAt: new Date(NOW.getTime() - 6 * 60 * 60 * 1000),
      lastStatus: "SUCCESS" as const,
      healthStatus: "HEALTHY" as const,
      lastMessage: "Matched 1 duplicate against an existing remote canonical job."
    },
    {
      id: "source-trinidad-company-template",
      slug: "trinidad-company-careers-template",
      name: "Trinidad Company Careers Template",
      sourceType: "HTML" as const,
      baseUrl: "https://careers.example.com",
      publicUrl: "https://careers.example.com/trinidad",
      fetchStrategy: "official-company-careers-html",
      parserKey: "company-careers-html",
      legalNotes:
        "Template configuration for an official company careers page that permits public retrieval. Keep disabled until legal review and parser validation are complete.",
      defaultTags: ["company-careers", "template"],
      regionTags: ["trinidad-and-tobago"],
      pollingIntervalMinutes: 720,
      dedupeStrategy: "canonical_url_or_company_title_location",
      config: { listPath: "/trinidad", maxItems: 10 },
      enabled: false,
      lastRunAt: null,
      lastSuccessAt: null,
      lastStatus: null,
      healthStatus: "DISABLED" as const,
      lastMessage: "Disabled until legal review and parser validation are complete."
    }
  ];

  for (const source of sources) {
    const { id, ...rest } = source;
    await prisma.discoverySource.upsert({
      where: { slug: source.slug },
      update: rest,
      create: { id, ...rest }
    });
  }

  const locations = [
    {
      id: "location-port-of-spain",
      slug: "port-of-spain-trinidad-and-tobago",
      rawValue: "Port of Spain, Trinidad and Tobago",
      normalizedValue: "Port of Spain, Trinidad and Tobago",
      country: "Trinidad and Tobago",
      region: "Trinidad and Tobago",
      city: "Port of Spain",
      scope: "TRINIDAD_TOBAGO" as const,
      isRemoteFriendly: false,
      isTrinidadAndTobago: true,
      isCaribbean: true,
      aliases: ["port of spain", "trinidad", "trinidad and tobago"]
    },
    {
      id: "location-remote-worldwide",
      slug: "remote-worldwide",
      rawValue: "Remote",
      normalizedValue: "Remote",
      country: null,
      region: null,
      city: null,
      scope: "REMOTE" as const,
      isRemoteFriendly: true,
      isTrinidadAndTobago: false,
      isCaribbean: true,
      aliases: ["remote", "worldwide"]
    }
  ];

  for (const location of locations) {
    const { id, ...rest } = location;
    await prisma.jobLocationNormalized.upsert({
      where: { slug: location.slug },
      update: rest,
      create: { id, ...rest }
    });
  }

  const manualJobs = [
    {
      id: "job-manual-acme-full-stack",
      sourceType: "MANUAL_TEXT" as const,
      sourceName: "Manual Seed Data",
      title: "Full-Stack PHP Developer",
      company: "Acme SaaS",
      location: "Remote",
      workMode: "REMOTE" as const,
      seniorityLevel: "MID" as const,
      salaryMin: 90000,
      salaryMax: 110000,
      description:
        "Build internal and customer-facing web apps using PHP, Laravel, MySQL, JavaScript, and TypeScript. Collaborate with product and design in a remote team.",
      requiredSkills: ["PHP", "Laravel", "MySQL", "JavaScript"],
      preferredSkills: ["TypeScript", "React"],
      requiredYearsExperience: 3,
      educationRequirements: "Bachelor's degree or equivalent experience",
      keywords: ["api", "saas", "typescript", "remote"],
      applicationUrl: "https://example.com/jobs/full-stack-php-developer",
      postedAt: new Date(NOW.getTime() - 20 * DAY)
    },
    {
      id: "job-manual-northwind-junior-engineer",
      sourceType: "CSV_IMPORT" as const,
      sourceName: "Manual CSV Seed",
      title: "Junior Software Engineer",
      company: "Northwind Labs",
      location: "Austin, TX",
      workMode: "HYBRID" as const,
      seniorityLevel: "JUNIOR" as const,
      salaryMin: 78000,
      salaryMax: 90000,
      description:
        "Support backend and frontend development across TypeScript and SQL systems. Great fit for candidates with React, PHP, and API experience.",
      requiredSkills: ["TypeScript", "SQL", "React"],
      preferredSkills: ["PHP", "REST APIs"],
      requiredYearsExperience: 2,
      educationRequirements: "CS degree preferred",
      keywords: ["junior", "typescript", "sql", "hybrid"],
      applicationUrl: "https://example.com/jobs/junior-software-engineer",
      postedAt: new Date(NOW.getTime() - 12 * DAY)
    }
  ];

  for (const job of manualJobs) {
    const { id, ...rest } = job;
    await prisma.job.upsert({ where: { id }, update: rest, create: { id, ...rest } });
  }

  const runs = [
    {
      id: "run-employtt-apr14",
      sourceId: "source-employtt-public",
      triggerMode: "MANUAL" as const,
      status: "SUCCESS" as const,
      startedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
      finishedAt: new Date(NOW.getTime() - 110 * 60 * 1000),
      jobsFound: 1,
      jobsImported: 1,
      duplicatesSkipped: 0,
      parsingFailures: 0,
      runtimeErrors: 0,
      summary: { jobsFound: 1, jobsImported: 1, duplicatesSkipped: 0, parsingFailures: 0, runtimeErrors: 0 }
    },
    {
      id: "run-wwr-apr13",
      sourceId: "source-we-work-remotely",
      triggerMode: "MANUAL" as const,
      status: "SUCCESS" as const,
      startedAt: new Date(NOW.getTime() - DAY),
      finishedAt: new Date(NOW.getTime() - DAY + 15 * 60 * 1000),
      jobsFound: 1,
      jobsImported: 1,
      duplicatesSkipped: 0,
      parsingFailures: 0,
      runtimeErrors: 0,
      summary: { jobsFound: 1, jobsImported: 1, duplicatesSkipped: 0, parsingFailures: 0, runtimeErrors: 0 }
    },
    {
      id: "run-remote-first-apr14",
      sourceId: "source-remote-first-jobs",
      triggerMode: "MANUAL" as const,
      status: "SUCCESS" as const,
      startedAt: new Date(NOW.getTime() - 6 * 60 * 60 * 1000),
      finishedAt: new Date(NOW.getTime() - 5 * 60 * 60 * 1000 - 50 * 60 * 1000),
      jobsFound: 1,
      jobsImported: 0,
      duplicatesSkipped: 1,
      parsingFailures: 0,
      runtimeErrors: 0,
      summary: { jobsFound: 1, jobsImported: 0, duplicatesSkipped: 1, parsingFailures: 0, runtimeErrors: 0 }
    }
  ];

  for (const run of runs) {
    const { id, ...rest } = run;
    await prisma.sourceRun.upsert({ where: { id }, update: rest, create: { id, ...rest } });
  }

  const dedupeGroups = [
    {
      id: "dedupe-island-commerce-full-stack",
      groupKey: "application:https://employtt.gov.tt/jobs/view/2244",
      canonicalNormalizedJobId: "normalized-employtt-full-stack",
      reason: "new_group",
      confidence: 1
    },
    {
      id: "dedupe-remote-stack-platform-engineer",
      groupKey: "canonical:remote-stack-co:platform-engineer:remote-worldwide",
      canonicalNormalizedJobId: "normalized-wwr-platform-engineer",
      reason: "description_similarity",
      confidence: 0.84
    }
  ];

  for (const group of dedupeGroups) {
    await prisma.dedupeGroup.upsert({
      where: { groupKey: group.groupKey },
      update: { reason: group.reason, confidence: group.confidence },
      create: {
        id: group.id,
        groupKey: group.groupKey,
        reason: group.reason,
        confidence: group.confidence
      }
    });
  }

  const discovered = [
    {
      canonicalJobId: "job-island-commerce-full-stack",
      rawId: "raw-employtt-full-stack",
      normalizedId: "normalized-employtt-full-stack",
      sourceId: "source-employtt-public",
      sourceRunId: "run-employtt-apr14",
      dedupeGroupId: "dedupe-island-commerce-full-stack",
      locationId: "location-port-of-spain",
      sourceType: "HTML" as const,
      sourceName: "EmployTT Public Jobs",
      sourceUrl: "https://employtt.gov.tt/jobs/view/2244",
      applicationUrl: "https://employtt.gov.tt/jobs/view/2244",
      title: "Full-Stack Developer",
      company: "Island Commerce Ltd",
      locationRaw: "Port of Spain, Trinidad and Tobago",
      locationText: "Port of Spain, Trinidad and Tobago",
      country: "Trinidad and Tobago",
      cityRegion: "Port of Spain",
      remoteStatus: "HYBRID" as const,
      isRemoteFriendly: false,
      isTrinidadAndTobago: true,
      isCaribbeanFriendly: true,
      salaryRaw: null,
      salaryMin: null,
      salaryMax: null,
      currency: null,
      description:
        "Build modern commerce tools for a Trinidad-based team using TypeScript, React, PostgreSQL, and API integrations. Work closely with operations and product teams in Port of Spain with hybrid flexibility.",
      requirements:
        "3+ years of software development experience, strong TypeScript or JavaScript skills, and practical SQL knowledge.",
      employmentType: "Full-time",
      experienceLevel: "MID" as const,
      postedAt: new Date(NOW.getTime() - 2 * DAY),
      discoveredAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
      importStatus: "IMPORTED" as const,
      dedupeKey: "application:https://employtt.gov.tt/jobs/view/2244",
      normalizedHash: "seed-hash-employtt-full-stack",
      similarityScore: 1,
      tags: ["trinidad-and-tobago", "public", "hybrid"],
      requiredSkills: ["TypeScript", "React", "PostgreSQL", "APIs"],
      preferredSkills: ["Node.js", "Figma"],
      requiredYearsExperience: 3,
      educationRequirements: "Bachelor's degree or equivalent experience",
      salaryCurrency: null,
      discoveryTrustWeight: 0.97
    },
    {
      canonicalJobId: "job-remote-stack-platform-engineer",
      rawId: "raw-wwr-platform-engineer",
      normalizedId: "normalized-wwr-platform-engineer",
      sourceId: "source-we-work-remotely",
      sourceRunId: "run-wwr-apr13",
      dedupeGroupId: "dedupe-remote-stack-platform-engineer",
      locationId: "location-remote-worldwide",
      sourceType: "RSS" as const,
      sourceName: "We Work Remotely RSS",
      sourceUrl: "https://weworkremotely.com/remote-jobs/remote-stack-co-platform-engineer",
      applicationUrl: "https://weworkremotely.com/remote-jobs/remote-stack-co-platform-engineer",
      title: "Platform Engineer",
      company: "Remote Stack Co",
      locationRaw: "Remote",
      locationText: "Remote",
      country: null,
      cityRegion: null,
      remoteStatus: "REMOTE" as const,
      isRemoteFriendly: true,
      isTrinidadAndTobago: false,
      isCaribbeanFriendly: true,
      salaryRaw: "$105,000 - $125,000",
      salaryMin: 105000,
      salaryMax: 125000,
      currency: "USD",
      description:
        "Own platform reliability, internal tooling, and deployment automation for a distributed engineering team. Strong fit for candidates with Node.js, TypeScript, PostgreSQL, Docker, and cloud infrastructure experience.",
      requirements:
        "3+ years in platform or backend engineering, strong TypeScript or Node.js background, and experience with cloud infrastructure.",
      employmentType: "Full-time",
      experienceLevel: "MID" as const,
      postedAt: new Date(NOW.getTime() - DAY),
      discoveredAt: new Date(NOW.getTime() - DAY),
      importStatus: "IMPORTED" as const,
      dedupeKey: "canonical:remote-stack-co:platform-engineer:remote-worldwide",
      normalizedHash: "seed-hash-wwr-platform-engineer",
      similarityScore: 1,
      tags: ["remote", "rss", "caribbean", "caribbean-friendly-remote"],
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
      preferredSkills: ["AWS", "Terraform"],
      requiredYearsExperience: 3,
      educationRequirements: "Bachelor's degree or equivalent experience",
      salaryCurrency: "USD",
      discoveryTrustWeight: 0.92
    },
    {
      canonicalJobId: "job-remote-stack-platform-engineer",
      rawId: "raw-remote-first-platform-engineer",
      normalizedId: "normalized-remote-first-platform-engineer",
      sourceId: "source-remote-first-jobs",
      sourceRunId: "run-remote-first-apr14",
      dedupeGroupId: "dedupe-remote-stack-platform-engineer",
      locationId: "location-remote-worldwide",
      sourceType: "API" as const,
      sourceName: "Remote First Jobs API",
      sourceUrl: "https://remotefirstjobs.com/jobs/remote-stack-co-platform-engineer",
      applicationUrl: "https://remotefirstjobs.com/jobs/remote-stack-co-platform-engineer",
      title: "Platform Engineer",
      company: "Remote Stack Co",
      locationRaw: "Remote",
      locationText: "Remote",
      country: null,
      cityRegion: null,
      remoteStatus: "REMOTE" as const,
      isRemoteFriendly: true,
      isTrinidadAndTobago: false,
      isCaribbeanFriendly: true,
      salaryRaw: "$110,000 - $130,000",
      salaryMin: 110000,
      salaryMax: 130000,
      currency: "USD",
      description:
        "Support platform operations, deployment automation, and service reliability across a fully remote company. Candidates with TypeScript, Docker, PostgreSQL, and cloud tooling will be strong fits.",
      requirements: "3+ years in platform engineering, infrastructure automation, and production support.",
      employmentType: "Full-time",
      experienceLevel: "MID" as const,
      postedAt: new Date(NOW.getTime() - 12 * 60 * 60 * 1000),
      discoveredAt: new Date(NOW.getTime() - 6 * 60 * 60 * 1000),
      importStatus: "DUPLICATE" as const,
      dedupeKey: "canonical:remote-stack-co:platform-engineer:remote-worldwide-api",
      normalizedHash: "seed-hash-remote-first-platform-engineer",
      similarityScore: 0.84,
      tags: ["remote", "api", "caribbean", "caribbean-friendly-remote"],
      requiredSkills: ["TypeScript", "Docker", "PostgreSQL"],
      preferredSkills: ["AWS"],
      requiredYearsExperience: 3,
      educationRequirements: "Bachelor's degree or equivalent experience",
      salaryCurrency: "USD",
      discoveryTrustWeight: 1
    }
  ];

  for (const item of discovered) {
    const rawData = {
      sourceId: item.sourceId,
      sourceRunId: item.sourceRunId,
      externalId: slugify(`${item.company}-${item.title}`),
      sourceUrl: item.sourceUrl,
      sourceType: item.sourceType,
      payload: { seeded: true, title: item.title, company: item.company },
      rawText: item.description,
      fingerprint: `${item.sourceId}:${item.sourceUrl}`,
      parseStatus: item.importStatus
    };

    await prisma.discoveredJobRaw.upsert({
      where: { id: item.rawId },
      update: rawData,
      create: { id: item.rawId, ...rawData }
    });

    const jobSourceType: "HTML_DISCOVERY" | "OFFICIAL_API" | "RSS_FEED" =
      item.sourceType === "HTML" ? "HTML_DISCOVERY" : item.sourceType === "API" ? "OFFICIAL_API" : "RSS_FEED";

    const jobData = {
      sourceType: jobSourceType,
      sourceName: item.sourceName,
      sourceReference: item.sourceUrl,
      title: item.title,
      company: item.company,
      location: item.locationText,
      locationRaw: item.locationRaw,
      locationNormalizedId: item.locationId,
      country: item.country,
      cityRegion: item.cityRegion,
      workMode: item.remoteStatus,
      isRemoteFriendly: item.isRemoteFriendly,
      isTrinidadAndTobago: item.isTrinidadAndTobago,
      isCaribbeanFriendlyRemote: item.isCaribbeanFriendly,
      seniorityLevel: item.experienceLevel,
      salaryRaw: item.salaryRaw,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      salaryCurrency: item.salaryCurrency,
      description: item.description,
      requirements: item.requirements,
      employmentType: item.employmentType,
      requiredSkills: item.requiredSkills,
      preferredSkills: item.preferredSkills,
      requiredYearsExperience: item.requiredYearsExperience,
      educationRequirements: item.educationRequirements,
      keywords: item.tags,
      applicationUrl: item.applicationUrl,
      postedAt: item.postedAt,
      discoveredAt: item.discoveredAt,
      lastSeenAt: NOW,
      isDiscoveredAutomatically: true,
      needsReview: true,
      discoveryTrustWeight: item.discoveryTrustWeight,
      discoverySourceId: item.sourceId,
      dedupeGroupId: item.dedupeGroupId,
      rawPayload: { seeded: true, sourceName: item.sourceName, sourceUrl: item.sourceUrl }
    };

    await prisma.job.upsert({
      where: { id: item.canonicalJobId },
      update: jobData,
      create: { id: item.canonicalJobId, ...jobData }
    });

    const normalizedData = {
      sourceId: item.sourceId,
      sourceRunId: item.sourceRunId,
      rawJobId: item.rawId,
      dedupeGroupId: item.dedupeGroupId,
      canonicalJobId: item.canonicalJobId,
      locationNormalizedId: item.locationId,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      applicationUrl: item.applicationUrl,
      externalId: slugify(`${item.company}-${item.title}`),
      title: item.title,
      company: item.company,
      locationRaw: item.locationRaw,
      locationText: item.locationText,
      country: item.country,
      cityRegion: item.cityRegion,
      remoteStatus: item.remoteStatus,
      isRemoteFriendly: item.isRemoteFriendly,
      isTrinidadAndTobago: item.isTrinidadAndTobago,
      isCaribbeanFriendly: item.isCaribbeanFriendly,
      salaryRaw: item.salaryRaw,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      currency: item.currency,
      description: item.description,
      requirements: item.requirements,
      employmentType: item.employmentType,
      experienceLevel: item.experienceLevel,
      postedAt: item.postedAt,
      discoveredAt: item.discoveredAt,
      importStatus: item.importStatus,
      dedupeKey: item.dedupeKey,
      normalizedHash: item.normalizedHash,
      similarityScore: item.similarityScore
    };

    await prisma.discoveredJobNormalized.upsert({
      where: { id: item.normalizedId },
      update: normalizedData,
      create: { id: item.normalizedId, ...normalizedData }
    });

    await syncJobTags(item.canonicalJobId, item.sourceId, item.tags);
    await syncDiscoveredTags(item.normalizedId, item.sourceId, item.tags);
  }

  for (const group of dedupeGroups) {
    await prisma.dedupeGroup.update({
      where: { groupKey: group.groupKey },
      data: {
        canonicalNormalizedJobId: group.canonicalNormalizedJobId
      }
    });
  }

  const logs = [
    {
      id: "log-employtt-import",
      sourceId: "source-employtt-public",
      sourceRunId: "run-employtt-apr14",
      discoveredJobId: "normalized-employtt-full-stack",
      level: "INFO" as const,
      message: "Imported discovered job Full-Stack Developer from the public EmployTT listing."
    },
    {
      id: "log-wwr-import",
      sourceId: "source-we-work-remotely",
      sourceRunId: "run-wwr-apr13",
      discoveredJobId: "normalized-wwr-platform-engineer",
      level: "INFO" as const,
      message: "Imported remote platform engineering role from the public RSS feed."
    },
    {
      id: "log-remote-first-duplicate",
      sourceId: "source-remote-first-jobs",
      sourceRunId: "run-remote-first-apr14",
      discoveredJobId: "normalized-remote-first-platform-engineer",
      level: "INFO" as const,
      message: "Grouped duplicate listing against the canonical remote platform engineer record."
    }
  ];

  for (const log of logs) {
    const { id, ...rest } = log;
    await prisma.fetchLog.upsert({ where: { id }, update: rest, create: { id, ...rest } });
  }

  await recomputeJobMatchesForUser(user.id);

  console.log(`Seeded demo user: ${email}`);
  console.log(`Seeded password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
