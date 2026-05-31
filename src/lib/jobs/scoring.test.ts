import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { JobSourceType, SeniorityLevel, WorkMode } from "@prisma/client";

import { scoreJobForUser } from "@/lib/jobs/scoring";

const defaultSettings = {
  id: "settings-1",
  userId: "user-1",
  titleWeight: 20,
  skillsWeight: 25,
  experienceWeight: 15,
  educationWeight: 10,
  locationWeight: 10,
  remoteWeight: 5,
  trinidadBoostWeight: 10,
  sourceTrustWeight: 5,
  salaryWeight: 5,
  certificationsWeight: 5,
  keywordWeight: 5,
  blacklistPenalty: 15,
  mismatchPenalty: 10,
  targetJobFamilies: [],
  includeKeywords: [],
  excludeKeywords: [],
  autoHideMinMatchPercent: 25,
  autoHideRules: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z")
};

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "user@example.com",
    passwordHash: "hash",
    fullName: "Generic User",
    phone: null,
    headline: null,
    yearsExperience: 0,
    onboardingComplete: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    preferences: null,
    scoringSettings: defaultSettings,
    resumes: [],
    ...overrides
  };
}

function preferences(overrides: Record<string, unknown> = {}) {
  return {
    id: "preference-1",
    userId: "user-1",
    desiredJobTitles: [],
    preferredIndustries: [],
    preferredLocations: [],
    workModes: [],
    minimumSalary: null,
    seniorityLevels: [],
    topSkills: [],
    certifications: [],
    degree: null,
    includeKeywords: [],
    excludeKeywords: [],
    targetCompanies: [],
    avoidCompanies: [],
    prioritizeTrinidad: false,
    allowCaribbeanRemote: true,
    autoHideEnabled: false,
    autoHideRules: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides
  };
}

function resumeData(overrides: Record<string, unknown> = {}) {
  return {
    id: "resume-data-1",
    resumeId: "resume-1",
    userId: "user-1",
    fullName: null,
    email: null,
    phone: null,
    location: null,
    summary: "",
    yearsExperience: 0,
    education: [],
    jobHistory: [],
    technicalSkills: [],
    softSkills: [],
    toolsPlatforms: [],
    certifications: [],
    projects: [],
    keywords: [],
    contactLinks: null,
    reviewNotes: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides
  };
}

function resume(extractedData: ReturnType<typeof resumeData>) {
  return {
    id: "resume-1",
    userId: "user-1",
    fileName: "resume.pdf",
    mimeType: "application/pdf",
    status: "REVIEWED",
    sourceType: "UPLOAD",
    parserVersion: "1.0.0",
    rawText: "",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    extractedData
  };
}

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    sourceType: JobSourceType.MANUAL_TEXT,
    sourceName: "Manual",
    sourceReference: null,
    title: "Frontend Developer",
    company: "Product Studio",
    location: "Remote",
    locationRaw: "Remote",
    locationNormalizedId: null,
    country: null,
    cityRegion: null,
    workMode: WorkMode.REMOTE,
    isRemoteFriendly: true,
    isTrinidadAndTobago: false,
    isCaribbeanFriendlyRemote: false,
    seniorityLevel: SeniorityLevel.JUNIOR,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryRaw: null,
    description: "Build product interfaces with React, TypeScript, APIs, dashboards, and analytics workflows.",
    summary: null,
    requirements: null,
    employmentType: "Full-time",
    requiredSkills: ["React", "TypeScript"],
    preferredSkills: ["Next.js", "Analytics"],
    requiredYearsExperience: 1,
    educationRequirements: null,
    keywords: ["frontend", "product"],
    applicationUrl: "https://example.com/job",
    postedAt: null,
    discoveredAt: new Date("2026-01-01T00:00:00Z"),
    lastSeenAt: null,
    isDiscoveredAutomatically: false,
    needsReview: true,
    discoveryTrustWeight: 1,
    discoverySourceId: null,
    dedupeGroupId: null,
    rawPayload: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides
  };
}

function score(
  userOverrides: Record<string, unknown>,
  jobOverrides: Record<string, unknown>,
  preferenceOverrides: Record<string, unknown> = {}
) {
  const userPreferences = preferences(preferenceOverrides);
  const candidate = user({
    preferences: userPreferences,
    ...userOverrides
  });

  return scoreJobForUser(candidate as never, job(jobOverrides) as never, defaultSettings as never, userPreferences as never);
}

describe("scoreJobForUser public calibration", () => {
  test("keeps sparse new-user scores usable while explaining low profile confidence", () => {
    const result = score(
      { resumes: [] },
      {
        title: "Entry Level Frontend Developer",
        seniorityLevel: SeniorityLevel.ENTRY,
        requiredYearsExperience: 0,
        requiredSkills: ["JavaScript"],
        preferredSkills: ["React"]
      },
      {
        desiredJobTitles: ["Frontend Developer"],
        workModes: [WorkMode.REMOTE]
      }
    );

    assert.ok(result.matchPercent >= 55, `expected usable sparse-profile score, got ${result.matchPercent}`);
    assert.ok(result.reasons.some((reason) => /profile confidence/i.test(reason.label)));
  });

  test("credits related frontend skills instead of requiring exact keyword matches", () => {
    const result = score(
      {},
      {
        title: "Junior Next.js Developer",
        requiredSkills: ["Next.js", "TypeScript"],
        preferredSkills: ["Tailwind CSS"],
        requiredYearsExperience: 1
      },
      {
        desiredJobTitles: ["Frontend Developer"],
        topSkills: ["React", "JavaScript", "CSS"],
        workModes: [WorkMode.REMOTE]
      }
    );

    assert.ok(result.matchPercent >= 70, `expected related frontend skills to score well, got ${result.matchPercent}`);
    assert.ok(result.matchedSkills.some((skill) => /react/i.test(skill) || /next/i.test(skill)));
  });

  test("uses project and resume evidence for junior full-stack roles", () => {
    const extractedData = resumeData({
      yearsExperience: 0,
      technicalSkills: ["React", "JavaScript"],
      toolsPlatforms: ["Prisma"],
      projects: [
        {
          name: "Inventory tracker",
          description: "Built full-stack CRUD workflows with API routes, PostgreSQL, dashboards, and reporting."
        }
      ],
      keywords: ["api", "postgresql", "dashboard"]
    });
    const result = score(
      {
        resumes: [resume(extractedData)]
      },
      {
        title: "Junior Full Stack Developer",
        requiredSkills: ["React", "Node.js", "PostgreSQL"],
        preferredSkills: ["Dashboard reporting"],
        requiredYearsExperience: 1,
        seniorityLevel: SeniorityLevel.JUNIOR
      },
      {
        desiredJobTitles: ["Full Stack Developer"],
        topSkills: ["React", "JavaScript"],
        workModes: [WorkMode.REMOTE]
      }
    );

    assert.ok(result.matchPercent >= 72, `expected project-heavy junior candidate to score well, got ${result.matchPercent}`);
    assert.ok(result.reasons.some((reason) => /project|resume evidence/i.test(reason.label)));
  });

  test("keeps senior roles lower for junior candidates without hard-crushing junior roles", () => {
    const juniorUser = {
      yearsExperience: 1,
      preferences: preferences({
        desiredJobTitles: ["Software Engineer"],
        topSkills: ["React", "TypeScript"],
        workModes: [WorkMode.REMOTE]
      })
    };
    const juniorJobResult = score(
      juniorUser,
      {
        title: "Junior Software Engineer",
        seniorityLevel: SeniorityLevel.JUNIOR,
        requiredYearsExperience: 1,
        requiredSkills: ["React", "TypeScript"]
      },
      juniorUser.preferences as Record<string, unknown>
    );
    const seniorJobResult = score(
      juniorUser,
      {
        title: "Senior Software Engineer",
        seniorityLevel: SeniorityLevel.SENIOR,
        requiredYearsExperience: 6,
        requiredSkills: ["React", "TypeScript", "System Design"]
      },
      juniorUser.preferences as Record<string, unknown>
    );

    assert.ok(juniorJobResult.matchPercent >= 75, `expected junior role to score well, got ${juniorJobResult.matchPercent}`);
    assert.ok(seniorJobResult.matchPercent <= juniorJobResult.matchPercent - 18);
    assert.ok(seniorJobResult.penalties.some((penalty) => /experience/i.test(penalty)));
  });

  test("treats hard onsite location constraints as blockers but missing nice-to-haves as soft gaps", () => {
    const result = score(
      {},
      {
        title: "Frontend Engineer",
        location: "Berlin, Germany - onsite only",
        workMode: WorkMode.ONSITE,
        isRemoteFriendly: false,
        requiredSkills: ["React", "TypeScript"],
        preferredSkills: ["GraphQL", "Figma", "Animation"],
        requiredYearsExperience: 1,
        description: "Onsite only in Berlin. Must already be authorized to work in Germany."
      },
      {
        desiredJobTitles: ["Frontend Engineer"],
        preferredLocations: ["Remote", "New York"],
        topSkills: ["React", "TypeScript"],
        workModes: [WorkMode.REMOTE]
      }
    );

    assert.ok(result.matchPercent < 60, `expected hard blocker to reduce score, got ${result.matchPercent}`);
    assert.ok(result.penalties.some((penalty) => /location|work mode|authorization/i.test(penalty)));
    assert.ok(result.missingSkills.length <= 2, "missing preferred skills should not dominate hard-blocked matches");
  });
});
