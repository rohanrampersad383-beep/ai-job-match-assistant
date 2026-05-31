import {
  ApplyRecommendation,
  MatchCategory,
  type Job,
  type Prisma,
  type ScoringSetting,
  type UserPreference
} from "@prisma/client";

import type { ScoreReason, ScoreResult } from "@/types";
import { arrayFromUnknown, clamp, normalizeText, uniqueArray } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

type UserWithMatchingContext = Prisma.UserGetPayload<{
  include: {
    preferences: true;
    scoringSettings: true;
    resumes: {
      include: {
        extractedData: true;
      };
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

const RELATED_SKILL_GROUPS = [
  ["javascript", "typescript", "ecmascript"],
  ["react", "next.js", "nextjs", "frontend", "ui", "tailwind", "css"],
  ["node.js", "nodejs", "node", "express", "api", "api routes", "backend", "server actions"],
  ["go", "golang"],
  ["sql", "postgresql", "postgres", "mysql", "prisma", "database", "database design"],
  ["dashboard", "dashboards", "analytics", "charts", "reporting", "data visualization"],
  ["ai", "llm", "agents", "automation", "machine learning", "workflow automation"],
  ["saas", "product", "startup", "b2b", "platform"],
  ["testing", "qa", "unit tests", "integration tests", "playwright", "vitest"],
  ["cloud", "aws", "azure", "gcp", "docker", "deployment", "devops"]
];

const JUNIOR_LEVELS = new Set(["ENTRY", "JUNIOR"]);
const SENIOR_LEVELS = new Set(["SENIOR", "LEAD", "PRINCIPAL"]);

function toSearchableText(job: Job) {
  return normalizeText(
    [job.title, job.company, job.location, job.description, ...(job.keywords ?? [])].join(" ")
  );
}

function skillKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenSet(items: string[]) {
  return new Set(items.map((item) => skillKey(item)).filter(Boolean));
}

function overlapRatio(left: string[], right: string[]) {
  const leftSet = tokenSet(left);
  const rightSet = tokenSet(right);
  const matches = Array.from(leftSet).filter((item) => rightSet.has(item));

  if (leftSet.size === 0 || rightSet.size === 0) {
    return {
      ratio: 0,
      matches: [] as string[]
    };
  }

  return {
    ratio: matches.length / Math.max(leftSet.size, rightSet.size),
    matches
  };
}

function buildReason(label: string, tone: ScoreReason["tone"]) {
  return { label, tone };
}

function textTokens(value: string) {
  return skillKey(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function phraseScore(left: string, right: string) {
  const leftTokens = new Set(textTokens(left));
  const rightTokens = new Set(textTokens(right));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const hits = Array.from(leftTokens).filter((token) => rightTokens.has(token));
  return hits.length / Math.max(leftTokens.size, rightTokens.size);
}

function bestTitleScore(desiredTitles: string[], jobTitle: string) {
  if (desiredTitles.length === 0) {
    return 0.75;
  }

  return desiredTitles.reduce((best, title) => {
    const desired = skillKey(title);
    const job = skillKey(jobTitle);

    if (desired && job.includes(desired)) {
      return Math.max(best, 1);
    }

    return Math.max(best, phraseScore(desired, job));
  }, 0);
}

function serializeUnknown(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getEvidenceCorpus(user: UserWithMatchingContext, latestResume: ReturnType<typeof getLatestResumeData>) {
  return normalizeText(
    [
      user.headline,
      latestResume?.summary,
      serializeUnknown(latestResume?.projects),
      serializeUnknown(latestResume?.jobHistory),
      serializeUnknown(latestResume?.education),
      latestResume?.keywords?.join(" "),
      latestResume?.softSkills?.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function relatedGroupFor(skill: string) {
  const key = skillKey(skill);
  return RELATED_SKILL_GROUPS.find((group) => group.some((item) => key.includes(skillKey(item)) || skillKey(item).includes(key)));
}

function isDirectSkillMatch(left: string, right: string) {
  const leftKey = skillKey(left);
  const rightKey = skillKey(right);

  if (!leftKey || !rightKey) {
    return false;
  }

  if (leftKey === rightKey) {
    return true;
  }

  if (Math.min(leftKey.length, rightKey.length) <= 2) {
    return false;
  }

  return leftKey.includes(rightKey) || rightKey.includes(leftKey);
}

function evaluateSkill(skill: string, profileSkills: string[], evidenceCorpus: string) {
  const key = skillKey(skill);
  const direct = profileSkills.find((candidate) => isDirectSkillMatch(candidate, skill));

  if (direct) {
    return { score: 1, match: skill, reason: "direct" as const };
  }

  const group = relatedGroupFor(skill);
  const related = group
    ? profileSkills.find((candidate) => group.some((item) => isDirectSkillMatch(candidate, item)))
    : undefined;

  if (related) {
    return { score: 0.78, match: `${skill} (related: ${related})`, reason: "related" as const };
  }

  if (key && evidenceCorpus.includes(key)) {
    return { score: 0.85, match: `${skill} (resume evidence)`, reason: "evidence" as const };
  }

  const relatedEvidence = group?.find((item) => evidenceCorpus.includes(skillKey(item)));
  if (relatedEvidence) {
    return { score: 0.62, match: `${skill} (project evidence: ${relatedEvidence})`, reason: "evidence" as const };
  }

  return { score: 0, match: null, reason: "missing" as const };
}

function evaluateSkillFit(requiredSkills: string[], preferredSkills: string[], profileSkills: string[], evidenceCorpus: string) {
  const required = requiredSkills.map((skill) => ({ skill, ...evaluateSkill(skill, profileSkills, evidenceCorpus) }));
  const preferred = preferredSkills.map((skill) => ({ skill, ...evaluateSkill(skill, profileSkills, evidenceCorpus) }));
  const average = (items: Array<{ score: number }>, fallback: number) =>
    items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : fallback;
  const requiredScore = average(required, profileSkills.length || evidenceCorpus ? 0.72 : 0.52);
  const preferredScore = average(preferred, 0.72);
  const directMatches = [...required, ...preferred].filter((item) => item.score >= 0.85).map((item) => item.match ?? item.skill);
  const relatedMatches = [...required, ...preferred].filter((item) => item.score >= 0.55 && item.score < 0.85).map((item) => item.match ?? item.skill);
  const missingRequired = required.filter((item) => item.score < 0.45).map((item) => item.skill);
  const missingPreferred = preferred.filter((item) => item.score < 0.45).map((item) => item.skill);

  return {
    score: requiredScore * 0.72 + preferredScore * 0.28,
    requiredScore,
    preferredScore,
    directMatches: uniqueArray(directMatches),
    relatedMatches: uniqueArray(relatedMatches),
    missingRequired,
    missingPreferred
  };
}

function profileSignalCount(user: UserWithMatchingContext, preferences: UserPreference | null, latestResume: ReturnType<typeof getLatestResumeData>): number {
  return [
    preferences?.desiredJobTitles?.length,
    preferences?.topSkills?.length,
    preferences?.preferredIndustries?.length,
    preferences?.preferredLocations?.length,
    preferences?.workModes?.length,
    latestResume?.technicalSkills?.length,
    latestResume?.toolsPlatforms?.length,
    latestResume?.keywords?.length,
    Array.isArray(latestResume?.projects) ? latestResume.projects.length : 0,
    user.yearsExperience || latestResume?.yearsExperience ? 1 : 0
  ].reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function seniorityScore(job: Job, yearsExperience: number) {
  if (!job.seniorityLevel) {
    return 0.82;
  }

  if (JUNIOR_LEVELS.has(job.seniorityLevel)) {
    return yearsExperience >= 1 ? 1 : 0.82;
  }

  if (job.seniorityLevel === "MID") {
    return yearsExperience >= 3 ? 1 : yearsExperience >= 1 ? 0.72 : 0.48;
  }

  if (SENIOR_LEVELS.has(job.seniorityLevel)) {
    return yearsExperience >= 5 ? 1 : yearsExperience >= 3 ? 0.68 : 0.32;
  }

  return 0.8;
}

function hasHardLocationLanguage(job: Job) {
  const text = skillKey(`${job.location} ${job.description} ${job.requirements ?? ""}`);
  return (
    /\bonsite only\b/.test(text) ||
    /\bon site only\b/.test(text) ||
    /\bmust be located\b/.test(text) ||
    /\bauthorized to work\b/.test(text) ||
    /\bwork authorization\b/.test(text) ||
    /\bno sponsorship\b/.test(text)
  );
}

function resolveCategory(matchPercent: number) {
  if (matchPercent >= 80) {
    return MatchCategory.HIGH_MATCH;
  }

  if (matchPercent >= 60) {
    return MatchCategory.MEDIUM_MATCH;
  }

  if (matchPercent >= 40) {
    return MatchCategory.STRETCH;
  }

  return MatchCategory.LOW_MATCH;
}

function resolveRecommendation(matchPercent: number, penalties: string[]) {
  if (penalties.some((penalty) => penalty.includes("Avoid company") || penalty.includes("blacklist"))) {
    return ApplyRecommendation.SKIP;
  }

  if (matchPercent >= 75) {
    return ApplyRecommendation.YES;
  }

  if (matchPercent >= 50) {
    return ApplyRecommendation.MAYBE;
  }

  return ApplyRecommendation.SKIP;
}

function getLatestResumeData(user: UserWithMatchingContext) {
  return user.resumes.find((resume) => resume.extractedData)?.extractedData ?? null;
}

export function scoreJobForUser(
  user: UserWithMatchingContext,
  job: Job,
  settings: ScoringSetting,
  preferences: UserPreference | null
): ScoreResult {
  const reasons: ScoreReason[] = [];
  const penalties: string[] = [];
  const latestResume = getLatestResumeData(user);
  const evidenceCorpus = getEvidenceCorpus(user, latestResume);
  const desiredTitles = preferences?.desiredJobTitles ?? [];
  const profileSkills = uniqueArray([
    ...(preferences?.topSkills ?? []),
    ...(preferences?.certifications ?? []),
    ...(latestResume?.technicalSkills ?? []),
    ...(latestResume?.toolsPlatforms ?? []),
    ...(latestResume?.certifications ?? []),
    ...(latestResume?.keywords ?? [])
  ]);
  const requiredSkills = uniqueArray(job.requiredSkills ?? []);
  const preferredSkills = uniqueArray(job.preferredSkills ?? []);
  const jobSkills = uniqueArray([...requiredSkills, ...preferredSkills]);
  const profileSignals = profileSignalCount(user, preferences, latestResume);
  const sparseProfile = profileSignals < 4;

  const titleRatio = bestTitleScore(desiredTitles, job.title);

  if (titleRatio >= 0.5) {
    reasons.push(buildReason(`Title aligns with your target roles.`, "positive"));
  } else if (desiredTitles.length > 0) {
    reasons.push(buildReason(`Title is outside your strongest target titles.`, "warning"));
  }

  if (sparseProfile) {
    reasons.push(
      buildReason(
        `Profile confidence is low because MatchIQ has limited skills, resume, or project evidence for this user.`,
        "neutral"
      )
    );
  }

  const skillFit = evaluateSkillFit(requiredSkills, preferredSkills, profileSkills, evidenceCorpus);
  if (skillFit.directMatches.length > 0) {
    reasons.push(
      buildReason(`Required or preferred skill evidence: ${skillFit.directMatches.slice(0, 4).join(", ")}.`, "positive")
    );
  }

  if (skillFit.relatedMatches.length > 0) {
    reasons.push(
      buildReason(`Related or transferable skill evidence: ${skillFit.relatedMatches.slice(0, 4).join(", ")}.`, "positive")
    );
  } else if (jobSkills.length > 0 && sparseProfile) {
    reasons.push(buildReason(`Add skills, projects, or resume details to raise confidence for this role.`, "neutral"));
  } else if (jobSkills.length > 0) {
    reasons.push(buildReason(`This role relies on skills not visible in your profile yet.`, "warning"));
  }

  if (sparseProfile && desiredTitles.length > 0 && titleRatio < 0.4 && skillFit.requiredScore <= 0.55) {
    penalties.push(`Insufficient role evidence for sparse profile`);
    reasons.push(
      buildReason(
        `Available profile data does not yet show enough title or required-skill evidence for this role.`,
        "warning"
      )
    );
  }

  if (skillFit.relatedMatches.some((match) => /project evidence|resume evidence/i.test(match))) {
    reasons.push(buildReason(`Resume or project evidence supports part of this role's skill profile.`, "positive"));
  }

  if (Array.isArray(latestResume?.projects) && latestResume.projects.length > 0 && skillFit.score >= 0.55) {
    reasons.push(buildReason(`Project evidence strengthens this match beyond job-title keywords.`, "positive"));
  }

  const yearsExperience = latestResume?.yearsExperience || user.yearsExperience || 0;
  let experienceScore = seniorityScore(job, yearsExperience);
  if (job.requiredYearsExperience) {
    const gap = yearsExperience - job.requiredYearsExperience;
    if (gap >= 0) {
      experienceScore = 1;
      reasons.push(buildReason(`Your experience level meets the requirement.`, "positive"));
    } else if (gap >= -1 || JUNIOR_LEVELS.has(job.seniorityLevel ?? "")) {
      experienceScore = Math.max(experienceScore, 0.72);
      reasons.push(buildReason(`You are close to the requested experience level.`, "neutral"));
    } else {
      experienceScore = Math.min(experienceScore, SENIOR_LEVELS.has(job.seniorityLevel ?? "") ? 0.24 : 0.4);
      penalties.push(`Experience requirement gap`);
      reasons.push(
        buildReason(
          `Requires ${job.requiredYearsExperience}+ years; your profile looks lighter than that.`,
          "warning"
        )
      );
    }
  }

  const degreeText = normalizeText(
    `${preferences?.degree ?? ""} ${arrayFromUnknown(latestResume?.education).map((value) => JSON.stringify(value)).join(" ")}`
  );
  const educationRequirement = normalizeText(job.educationRequirements ?? "");
  let educationScore = 0.75;
  if (educationRequirement) {
    if (
      degreeText.includes("bachelor") ||
      degreeText.includes("bs") ||
      degreeText.includes("bsc") ||
      degreeText.includes("computer science")
    ) {
      educationScore = 1;
      reasons.push(buildReason(`Education requirement appears covered.`, "positive"));
    } else {
      educationScore = 0.45;
      reasons.push(buildReason(`Education match is uncertain from the current profile.`, "neutral"));
    }
  }

  const locationTargets = preferences?.preferredLocations ?? [];
  const workModes = preferences?.workModes ?? [];
  const locationText = normalizeText(job.location);
  let locationScore = 0.7;
  const hardLocationLanguage = hasHardLocationLanguage(job);
  if (locationTargets.length > 0) {
    const locationHit = locationTargets.some((item) => locationText.includes(normalizeText(item)));
    const remoteCompatible = (job.workMode === "REMOTE" || job.isRemoteFriendly) && workModes.includes("REMOTE");
    locationScore = locationHit || remoteCompatible ? 1 : hardLocationLanguage ? 0.08 : 0.48;
    reasons.push(
      buildReason(
        locationHit || remoteCompatible ? `Location and remote setup fit your preferences.` : `Location is outside your preferred regions.`,
        locationHit || remoteCompatible ? "positive" : "warning"
      )
    );

    if (!locationHit && !remoteCompatible && hardLocationLanguage) {
      penalties.push(`Hard location or work authorization blocker`);
    }
  }

  let trinidadScore = 0.75;
  const explicitlyTargetsTrinidad = locationTargets.some((item) => /trinidad|tobago|caribbean/i.test(item));
  if (preferences?.prioritizeTrinidad && explicitlyTargetsTrinidad) {
    if (job.isTrinidadAndTobago) {
      trinidadScore = 1;
      reasons.push(buildReason(`This role is located in Trinidad and Tobago.`, "positive"));
    } else if (job.isCaribbeanFriendlyRemote && preferences.allowCaribbeanRemote) {
      trinidadScore = 0.8;
      reasons.push(buildReason(`This remote role appears Caribbean-friendly.`, "positive"));
    } else {
      trinidadScore = 0.42;
    }
  }

  let remoteScore = 0.7;
  if (job.workMode && workModes.length > 0) {
    const remoteMatch = workModes.includes(job.workMode);
    remoteScore = remoteMatch ? 1 : hardLocationLanguage ? 0.08 : 0.35;
    reasons.push(
      buildReason(
        remoteMatch ? `Work mode matches your preference.` : `Work mode conflicts with your preference.`,
        remoteMatch ? "positive" : "warning"
      )
    );
    if (!remoteMatch) {
      penalties.push(`Work mode mismatch`);
    }
  }

  const sourceTrustScore = Math.min(Math.max(job.discoveryTrustWeight ?? 1, 0), 1);
  if (job.isDiscoveredAutomatically) {
    reasons.push(
      buildReason(
        `Source trust weighting applied from ${job.sourceName}.`,
        sourceTrustScore >= 0.95 ? "positive" : "neutral"
      )
    );
  }

  let salaryScore = 0.6;
  if (preferences?.minimumSalary && job.salaryMin) {
    if (job.salaryMin >= preferences.minimumSalary) {
      salaryScore = 1;
      reasons.push(buildReason(`Listed salary meets your target.`, "positive"));
    } else if (job.salaryMax && job.salaryMax >= preferences.minimumSalary) {
      salaryScore = 0.7;
      reasons.push(buildReason(`Salary range partially reaches your target.`, "neutral"));
    } else {
      salaryScore = 0.2;
      reasons.push(buildReason(`Salary appears below your target.`, "warning"));
      penalties.push(`Salary below minimum target`);
    }
  }

  const certificationMatch = overlapRatio(
    preferences?.certifications ?? [],
    latestResume?.certifications ?? []
  );
  const certificationScore =
    (preferences?.certifications?.length ?? 0) === 0 ? 0.7 : certificationMatch.ratio || 0.4;

  if (certificationMatch.matches.length > 0) {
    reasons.push(
      buildReason(`Certification overlap: ${certificationMatch.matches.slice(0, 2).join(", ")}.`, "positive")
    );
  }

  const searchableJobText = toSearchableText(job);
  const includedKeywords = uniqueArray([
    ...(preferences?.includeKeywords ?? []),
    ...(preferences?.preferredIndustries ?? []),
    ...(settings.includeKeywords ?? [])
  ]);
  const keywordHits = includedKeywords.filter((keyword) =>
    searchableJobText.includes(normalizeText(keyword))
  );
  const keywordScore =
    includedKeywords.length === 0 ? 0.75 : keywordHits.length / includedKeywords.length;

  if (keywordHits.length > 0) {
    reasons.push(
      buildReason(`Relevant domain or keyword signals found: ${keywordHits.slice(0, 4).join(", ")}.`, "positive")
    );
  }

  const excludedKeywords = uniqueArray([
    ...(preferences?.excludeKeywords ?? []),
    ...(settings.excludeKeywords ?? [])
  ]);
  const matchedBlacklist = excludedKeywords.filter((keyword) =>
    searchableJobText.includes(normalizeText(keyword))
  );

  if (matchedBlacklist.length > 0) {
    penalties.push(`Contains blacklist keywords: ${matchedBlacklist.join(", ")}`);
    reasons.push(buildReason(`Excluded keywords appear in this role.`, "warning"));
  }

  const avoidCompanies = preferences?.avoidCompanies ?? [];
  if (avoidCompanies.some((company) => normalizeText(company) === normalizeText(job.company))) {
    penalties.push(`Avoid company preference matched`);
    reasons.push(buildReason(`This company is on your avoid list.`, "warning"));
  }

  const weightedScore =
    titleRatio * settings.titleWeight +
    skillFit.score * settings.skillsWeight +
    experienceScore * settings.experienceWeight +
    educationScore * settings.educationWeight +
    locationScore * settings.locationWeight +
    trinidadScore * settings.trinidadBoostWeight +
    remoteScore * settings.remoteWeight +
    sourceTrustScore * settings.sourceTrustWeight +
    salaryScore * settings.salaryWeight +
    certificationScore * settings.certificationsWeight +
    keywordScore * settings.keywordWeight;

  const maxScore =
    settings.titleWeight +
    settings.skillsWeight +
    settings.experienceWeight +
    settings.educationWeight +
    settings.locationWeight +
    settings.trinidadBoostWeight +
    settings.remoteWeight +
    settings.sourceTrustWeight +
    settings.salaryWeight +
    settings.certificationsWeight +
    settings.keywordWeight;

  const penaltyTotal =
    matchedBlacklist.length * settings.blacklistPenalty +
    Math.max(penalties.length - matchedBlacklist.length, 0) * settings.mismatchPenalty;

  const rawMatchPercent = Math.round(((weightedScore - penaltyTotal) / maxScore) * 100);
  const calibratedFloor = sparseProfile && !penalties.length ? 52 : 0;
  const matchPercent = clamp(Math.max(rawMatchPercent, calibratedFloor));

  return {
    totalScore: Number((matchPercent / 100).toFixed(4)),
    matchPercent,
    category: resolveCategory(matchPercent),
    applyWorthIt: resolveRecommendation(matchPercent, penalties),
    reasons,
    matchedSkills: uniqueArray([...skillFit.directMatches, ...skillFit.relatedMatches]),
    missingSkills: uniqueArray([...skillFit.missingRequired, ...skillFit.missingPreferred.slice(0, 2)]),
    penalties
  };
}

export async function recomputeJobMatchesForUser(userId: string, specificJobIds?: string[]) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      scoringSettings: true,
      resumes: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          extractedData: true
        }
      }
    }
  });

  if (!user) {
    return;
  }

  const settings = user.scoringSettings ?? (await prisma.scoringSetting.create({ data: { userId } }));
  const jobs = await prisma.job.findMany({
    where: specificJobIds ? { id: { in: specificJobIds } } : undefined
  });

  for (const job of jobs) {
    const result = scoreJobForUser(user, job, settings, user.preferences);

    await prisma.jobMatch.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id
        }
      },
      update: {
        totalScore: result.totalScore,
        matchPercent: result.matchPercent,
        category: result.category,
        applyWorthIt: result.applyWorthIt,
        reasons: result.reasons,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        penalties: result.penalties
      },
      create: {
        userId,
        jobId: job.id,
        totalScore: result.totalScore,
        matchPercent: result.matchPercent,
        category: result.category,
        applyWorthIt: result.applyWorthIt,
        reasons: result.reasons,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        penalties: result.penalties
      }
    });
  }
}

export async function recomputeJobMatchesForAllUsers(jobIds?: string[]) {
  const users = await prisma.user.findMany({
    select: {
      id: true
    }
  });

  for (const user of users) {
    await recomputeJobMatchesForUser(user.id, jobIds);
  }
}
