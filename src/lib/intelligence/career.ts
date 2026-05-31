import { clamp, titleCase } from "@/lib/utils";
import type { ScoreReason } from "@/types";

type MatchSignal = {
  matchPercent: number;
  category?: string;
  applyWorthIt?: string;
  reasons?: unknown;
  matchedSkills?: string[];
  missingSkills?: string[];
};

type JobSignal = {
  title: string;
  company: string;
  location: string;
  workMode: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isRemoteFriendly: boolean;
  isTrinidadAndTobago: boolean;
  isCaribbeanFriendlyRemote: boolean;
  seniorityLevel?: string | null;
  matches: MatchSignal[];
};

type ProfileSignal = {
  desiredJobTitles?: string[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  workModes?: string[];
  topSkills?: string[];
  certifications?: string[];
  targetCompanies?: string[];
};

type ResumeSignal = {
  technicalSkills?: string[];
  softSkills?: string[];
  toolsPlatforms?: string[];
  certifications?: string[];
  yearsExperience?: number;
  summary?: string | null;
  projects?: unknown;
};

type CareerIntelligenceInput<TJob extends JobSignal> = {
  jobs: TJob[];
  summary: {
    highMatchJobs: number;
    remoteJobs: number;
    trinidadJobs: number;
    needsReview: number;
  };
  total: number;
  profile?: ProfileSignal | null;
  resume?: ResumeSignal | null;
};

export type OpportunityConfidence = {
  overall: number;
  tier: "High Confidence" | "Growth Match" | "Watchlist";
  dimensions: Array<{
    label: string;
    value: number;
    rationale: string;
  }>;
  badges: string[];
};

export type MatchExplanation = {
  summary: string;
  strongestAlignment: string[];
  watchouts: string[];
  nextStep: string;
  confidence: OpportunityConfidence;
};

export type CareerIntelligence = {
  profileScore: number;
  profileReadiness: Array<{
    label: string;
    complete: boolean;
    detail: string;
  }>;
  strengths: string[];
  gaps: string[];
  demand: string[];
  roleCluster: string;
  insights: string[];
  recommendations: Array<{
    title: string;
    detail: string;
    impact: "High" | "Medium" | "Focused";
  }>;
};

const HIGH_DEMAND_TERMS = [
  "ai",
  "machine learning",
  "llm",
  "typescript",
  "react",
  "cloud",
  "sql",
  "automation",
  "data",
  "analytics",
  "security",
  "platform",
  "product"
];

const ROLE_CLUSTERS = [
  { label: "AI-enhanced frontend engineering", terms: ["frontend", "react", "typescript", "ui", "product"] },
  { label: "full-stack SaaS implementation", terms: ["full stack", "full-stack", "backend", "api", "database", "saas"] },
  { label: "career data and analytics systems", terms: ["data", "analytics", "intelligence", "insight", "platform"] },
  { label: "product engineering and delivery", terms: ["product", "systems", "workflow", "delivery", "strategy"] },
  { label: "remote-first software roles", terms: ["remote", "distributed", "global", "caribbean"] }
];

export function getPrimaryMatch<TJob extends JobSignal>(job: TJob) {
  return job.matches[0];
}

export function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

export function uniqueSignals(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();

    if (!normalized) {
      continue;
    }

    const key = normalizeSkill(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      output.push(normalized);
    }
  }

  return output;
}

export function scoreReasons(value: unknown): ScoreReason[] {
  return Array.isArray(value) ? (value as ScoreReason[]) : [];
}

export function getOpportunityConfidence<TJob extends JobSignal>(job: TJob): OpportunityConfidence {
  const match = getPrimaryMatch(job);
  const matchScore = match?.matchPercent ?? 0;
  const matchedSkills = match?.matchedSkills ?? [];
  const missingSkills = match?.missingSkills ?? [];
  const allSkills = uniqueSignals([...job.requiredSkills, ...job.preferredSkills]);
  const lowerText = `${job.title} ${job.description} ${allSkills.join(" ")}`.toLowerCase();
  const demandHits = HIGH_DEMAND_TERMS.filter((term) => lowerText.includes(term));
  const remoteScore = job.workMode === "REMOTE" || job.isRemoteFriendly ? 94 : job.isCaribbeanFriendlyRemote ? 82 : 62;
  const skillCoverage = allSkills.length ? Math.round((matchedSkills.length / allSkills.length) * 100) : matchScore;
  const compensationScore = job.salaryMin || job.salaryMax ? 82 : 56;
  const growthScore = clamp(58 + demandHits.length * 7 + (job.seniorityLevel === "SENIOR" || job.seniorityLevel === "LEAD" ? 8 : 0));
  const experienceScore = clamp(matchScore - (missingSkills.length ? 4 : 0) + (job.seniorityLevel ? 5 : 0));
  const recruiterScore = clamp(Math.round((matchScore + skillCoverage + growthScore) / 3));

  const dimensions = [
    {
      label: "Skill fit",
      value: clamp(Math.max(skillCoverage, matchScore - 8)),
      rationale: matchedSkills.length
        ? `${matchedSkills.slice(0, 3).join(", ")} map directly to the role.`
        : "The current score is driven by broader profile and title signals."
    },
    {
      label: "Experience alignment",
      value: experienceScore,
      rationale: job.seniorityLevel
        ? `${titleCase(job.seniorityLevel)} expectations appear compatible with your profile signals.`
        : "Seniority is not explicit, so MatchIQ weights skills and description more heavily."
    },
    {
      label: "Remote compatibility",
      value: remoteScore,
      rationale: job.workMode === "REMOTE" || job.isRemoteFriendly
        ? "Remote-friendly context is a strong fit for your search strategy."
        : "Location may require extra review before prioritizing."
    },
    {
      label: "Market demand",
      value: clamp(60 + demandHits.length * 8),
      rationale: demandHits.length
        ? `${uniqueSignals(demandHits).slice(0, 3).join(", ")} are active demand signals in this role.`
        : "Demand is inferred from general role relevance rather than high-signal keywords."
    },
    {
      label: "Growth potential",
      value: growthScore,
      rationale: "Weighted from seniority, AI/product/cloud/data language, and role scope."
    },
    {
      label: "Compensation signal",
      value: compensationScore,
      rationale: job.salaryMin || job.salaryMax
        ? "Published salary data improves confidence in prioritization."
        : "Missing salary data lowers confidence until the role is reviewed."
    },
    {
      label: "Recruiter relevance",
      value: recruiterScore,
      rationale: "Composite of score, skill coverage, and role-market language."
    }
  ];

  const overall = clamp(Math.round(dimensions.reduce((sum, item) => sum + item.value, 0) / dimensions.length));
  const tier = overall >= 82 ? "High Confidence" : overall >= 68 ? "Growth Match" : "Watchlist";
  const badges = [
    overall >= 82 ? "High Confidence" : null,
    growthScore >= 78 ? "Growth Match" : null,
    remoteScore >= 82 ? "Strong Remote Fit" : null,
    demandHits.length >= 2 ? "Recruiter Demand" : null,
    missingSkills.length ? "Skill Gap" : null
  ].filter((badge): badge is string => Boolean(badge));

  return { overall, tier, dimensions, badges };
}

export function explainJobMatch<TJob extends JobSignal>(job: TJob): MatchExplanation {
  const match = getPrimaryMatch(job);
  const confidence = getOpportunityConfidence(job);
  const matchedSkills = match?.matchedSkills ?? [];
  const missingSkills = match?.missingSkills ?? [];
  const roleSkills = uniqueSignals([...job.requiredSkills, ...job.preferredSkills]);
  const scoredReasons = scoreReasons(match?.reasons);
  const reasons = scoredReasons.map((reason) => reason.label);
  const cautionReasons = scoredReasons
    .filter((reason) => reason.tone === "warning" || /profile confidence/i.test(reason.label))
    .map((reason) => reason.label);
  const workMode = job.workMode ? titleCase(job.workMode) : "unspecified";

  const strongestAlignment = uniqueSignals([
    matchedSkills.length
      ? `Direct skill overlap: ${matchedSkills.slice(0, 4).join(", ")}.`
      : roleSkills.length
        ? `Role keywords align around ${roleSkills.slice(0, 3).join(", ")}.`
        : null,
    job.isRemoteFriendly || job.workMode === "REMOTE"
      ? `Remote compatibility is strong for this ${workMode.toLowerCase()} opportunity.`
      : job.isTrinidadAndTobago
        ? "Local market relevance improves prioritization for Trinidad and Tobago."
        : null,
    reasons[0],
    confidence.dimensions.find((item) => item.label === "Market demand")?.rationale
  ]).slice(0, 4);

  const watchouts = uniqueSignals([
    missingSkills.length ? `Potential gap: ${missingSkills.slice(0, 3).join(", ")}.` : null,
    ...cautionReasons.slice(0, 2),
    !job.salaryMin && !job.salaryMax ? "Salary is not listed, so compensation fit needs manual review." : null,
    confidence.overall < 70 ? "Confidence is moderate; compare role scope before applying." : null
  ]).slice(0, 3);

  const summary =
    match?.matchPercent && match.matchPercent >= 85
      ? `MatchIQ ranks this highly because ${job.title} combines strong role relevance with clear skill and market signals.`
      : match?.matchPercent && match.matchPercent >= 70
        ? `This is a credible growth match with useful overlap, but the gaps should be checked before applying.`
        : `This role has partial alignment and is best treated as a watchlist opportunity until more profile signals are added.`;

  const nextStep = missingSkills[0]
    ? `Add evidence for ${missingSkills[0]} or prepare a concise project example before outreach.`
    : "Open the role details and tailor your application around the strongest matched skills.";

  return { summary, strongestAlignment, watchouts, nextStep, confidence };
}

export function analyzeCareerIntelligence<TJob extends JobSignal>({
  jobs,
  summary,
  total,
  profile,
  resume
}: CareerIntelligenceInput<TJob>): CareerIntelligence {
  const matchedSkills = jobs.flatMap((job) => getPrimaryMatch(job)?.matchedSkills ?? []);
  const missingSkills = jobs.flatMap((job) => getPrimaryMatch(job)?.missingSkills ?? []);
  const roleSkills = jobs.flatMap((job) => [...job.requiredSkills, ...job.preferredSkills]);
  const resumeSkills = uniqueSignals([
    ...(resume?.technicalSkills ?? []),
    ...(resume?.toolsPlatforms ?? []),
    ...(resume?.softSkills ?? [])
  ]);
  const preferredSkills = profile?.topSkills ?? [];
  const strengths = uniqueSignals([...preferredSkills, ...resumeSkills, ...matchedSkills]).slice(0, 7);
  const demand = uniqueSignals(roleSkills)
    .sort((left, right) => signalFrequency(right, roleSkills) - signalFrequency(left, roleSkills))
    .slice(0, 7);
  const gaps = uniqueSignals(missingSkills.length ? missingSkills : demand.filter((skill) => !hasSignal(strengths, skill))).slice(0, 6);
  const roleCluster = inferRoleCluster(jobs);
  const readiness = [
    {
      label: "Resume parsed",
      complete: Boolean(resume),
      detail: resume ? "Latest resume signals are available for ranking." : "Upload a resume to improve semantic matching."
    },
    {
      label: "Target roles",
      complete: Boolean(profile?.desiredJobTitles?.length),
      detail: profile?.desiredJobTitles?.length
        ? `${profile.desiredJobTitles.slice(0, 2).join(", ")} are guiding recommendations.`
        : "Add target titles to sharpen cluster detection."
    },
    {
      label: "Skill signals",
      complete: strengths.length >= 4,
      detail: strengths.length >= 4
        ? `${strengths.slice(0, 3).join(", ")} are usable high-value signals.`
        : "Add more technical and project skills to improve confidence."
    },
    {
      label: "Work-mode strategy",
      complete: Boolean(profile?.workModes?.length || summary.remoteJobs),
      detail: summary.remoteJobs
        ? "Remote-first signals are active in the current opportunity set."
        : "Set preferred work modes to improve location recommendations."
    },
    {
      label: "Market coverage",
      complete: total > 0,
      detail: total > 0 ? `${total} ranked opportunities are available for analysis.` : "Run discovery to create a ranked opportunity set."
    }
  ];
  const profileScore = Math.round((readiness.filter((item) => item.complete).length / readiness.length) * 100);
  const topStrength = strengths[0] ?? "your strongest profile signals";
  const topGap = gaps[0] ?? "cloud deployment evidence";
  const remoteInsight = summary.remoteJobs > 0
    ? `Remote-first roles are matching strongly with ${summary.remoteJobs} remote-compatible opportunities in view.`
    : "Remote compatibility is not yet a strong signal in this view.";

  return {
    profileScore,
    profileReadiness: readiness,
    strengths: strengths.length ? strengths : ["Profile targeting", "Application focus", "Role analysis"],
    gaps: gaps.length ? gaps : ["Cloud deployment keywords", "AI tooling evidence", "Portfolio proof points"],
    demand: demand.length ? demand : ["React", "SQL", "Automation", "Cloud", "Analytics"],
    roleCluster,
    insights: [
      `Your strongest opportunity cluster is currently ${roleCluster}.`,
      `${topStrength} is one of your highest-value match signals across the current role set.`,
      remoteInsight,
      summary.needsReview
        ? `${summary.needsReview} opportunities need review before MatchIQ can learn from your decisions.`
        : "Your review queue is clean, so new discovery runs can be evaluated quickly.",
      `${topGap} is the clearest profile improvement target.`
    ],
    recommendations: [
      {
        title: `Strengthen ${topGap}`,
        detail: `Add one resume bullet, project note, or portfolio artifact that proves ${topGap}.`,
        impact: "High"
      },
      {
        title: `Double down on ${roleCluster}`,
        detail: "Prioritize roles that share this cluster language before widening the search.",
        impact: "Medium"
      },
      {
        title: "Review high-confidence matches first",
        detail: "Use the queue to mark strong matches reviewed so future ranking signals get cleaner.",
        impact: "Focused"
      }
    ]
  };
}

function inferRoleCluster<TJob extends JobSignal>(jobs: TJob[]) {
  const corpus = jobs.map((job) => `${job.title} ${job.description} ${job.requiredSkills.join(" ")}`).join(" ").toLowerCase();
  const ranked = ROLE_CLUSTERS.map((cluster) => ({
    label: cluster.label,
    score: cluster.terms.filter((term) => corpus.includes(term)).length
  })).sort((left, right) => right.score - left.score);

  return ranked[0]?.score ? ranked[0].label : "career intelligence and software delivery";
}

function signalFrequency(signal: string, corpus: string[]) {
  const normalized = normalizeSkill(signal);
  return corpus.filter((item) => normalizeSkill(item) === normalized).length;
}

function hasSignal(signals: string[], value: string) {
  const normalized = normalizeSkill(value);
  return signals.some((signal) => normalizeSkill(signal) === normalized);
}
