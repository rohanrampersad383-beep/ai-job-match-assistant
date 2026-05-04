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

function toSearchableText(job: Job) {
  return normalizeText(
    [job.title, job.company, job.location, job.description, ...(job.keywords ?? [])].join(" ")
  );
}

function tokenSet(items: string[]) {
  return new Set(items.map((item) => normalizeText(item)).filter(Boolean));
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
  const desiredTitles = preferences?.desiredJobTitles ?? [];
  const profileSkills = uniqueArray([
    ...(preferences?.topSkills ?? []),
    ...(preferences?.certifications ?? []),
    ...(latestResume?.technicalSkills ?? []),
    ...(latestResume?.toolsPlatforms ?? [])
  ]);
  const jobSkills = uniqueArray([...(job.requiredSkills ?? []), ...(job.preferredSkills ?? [])]);

  const titleRatio =
    desiredTitles.length === 0
      ? 0.75
      : overlapRatio(desiredTitles, [job.title, ...job.title.split(/[-/|]/)]).ratio;

  if (titleRatio >= 0.5) {
    reasons.push(buildReason(`Title aligns with your target roles.`, "positive"));
  } else if (desiredTitles.length > 0) {
    reasons.push(buildReason(`Title is outside your strongest target titles.`, "warning"));
  }

  const skillMatch = overlapRatio(jobSkills, profileSkills);
  if (skillMatch.matches.length > 0) {
    reasons.push(
      buildReason(`Strong overlap on ${skillMatch.matches.slice(0, 4).join(", ")}.`, "positive")
    );
  } else if (jobSkills.length > 0) {
    reasons.push(buildReason(`This role relies on skills not visible in your profile yet.`, "warning"));
  }

  const yearsExperience = latestResume?.yearsExperience || user.yearsExperience || 0;
  let experienceScore = 0.8;
  if (job.requiredYearsExperience) {
    const gap = yearsExperience - job.requiredYearsExperience;
    if (gap >= 0) {
      experienceScore = 1;
      reasons.push(buildReason(`Your experience level meets the requirement.`, "positive"));
    } else if (gap >= -1) {
      experienceScore = 0.65;
      reasons.push(buildReason(`You are close to the requested experience level.`, "neutral"));
    } else {
      experienceScore = 0.25;
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
  if (locationTargets.length > 0) {
    const locationHit = locationTargets.some((item) => locationText.includes(normalizeText(item)));
    locationScore = locationHit ? 1 : 0.35;
    reasons.push(
      buildReason(
        locationHit ? `Location matches your preferred regions.` : `Location is outside your preferred regions.`,
        locationHit ? "positive" : "warning"
      )
    );
  }

  let trinidadScore = 0.5;
  if (preferences?.prioritizeTrinidad) {
    if (job.isTrinidadAndTobago) {
      trinidadScore = 1;
      reasons.push(buildReason(`This role is located in Trinidad and Tobago.`, "positive"));
    } else if (job.isCaribbeanFriendlyRemote && preferences.allowCaribbeanRemote) {
      trinidadScore = 0.8;
      reasons.push(buildReason(`This remote role appears Caribbean-friendly.`, "positive"));
    } else {
      trinidadScore = 0.3;
    }
  }

  let remoteScore = 0.7;
  if (job.workMode && workModes.length > 0) {
    const remoteMatch = workModes.includes(job.workMode);
    remoteScore = remoteMatch ? 1 : 0.2;
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
    ...(settings.includeKeywords ?? [])
  ]);
  const keywordHits = includedKeywords.filter((keyword) =>
    searchableJobText.includes(normalizeText(keyword))
  );
  const keywordScore =
    includedKeywords.length === 0 ? 0.75 : keywordHits.length / includedKeywords.length;

  if (keywordHits.length > 0) {
    reasons.push(
      buildReason(`Relevant keywords found: ${keywordHits.slice(0, 4).join(", ")}.`, "positive")
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
    skillMatch.ratio * settings.skillsWeight +
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

  const matchPercent = clamp(Math.round(((weightedScore - penaltyTotal) / maxScore) * 100));

  return {
    totalScore: Number(((weightedScore - penaltyTotal) / maxScore).toFixed(4)),
    matchPercent,
    category: resolveCategory(matchPercent),
    applyWorthIt: resolveRecommendation(matchPercent, penalties),
    reasons,
    matchedSkills: skillMatch.matches,
    missingSkills: job.requiredSkills.filter(
      (skill) => !profileSkills.some((profileSkill) => normalizeText(profileSkill) === normalizeText(skill))
    ),
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
