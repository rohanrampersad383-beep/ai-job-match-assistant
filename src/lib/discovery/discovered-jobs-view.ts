export type DiscoveredJobSort = "priority" | "match" | "confidence" | "source" | "discovered" | "review";
export type DiscoveredJobConfidenceFilter = "all" | "high" | "medium-plus" | "needs-work";

type MatchSnapshot = {
  matchPercent?: number | null;
  reviewedAt?: Date | string | null;
};

type ExplanationSnapshot = {
  confidence: {
    tier: string;
    overall: number;
    badges: string[];
  };
  nextStep: string;
};

export type DiscoveredJobRowInput = {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceName: string;
  discoveredAt: Date | string | null;
  needsReview: boolean;
  isRemoteFriendly: boolean;
  isTrinidadAndTobago: boolean;
  workMode: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  discoverySource?: {
    id: string;
    name: string;
  } | null;
  matches: MatchSnapshot[];
  savedBy: unknown[];
  hiddenBy?: unknown[];
  applications: unknown[];
};

export type DiscoveredJobRow = {
  job: DiscoveredJobRowInput;
  sourceId?: string;
  sourceLabel: string;
  matchPercent: number;
  confidenceScore: number;
  confidenceTier: string;
  confidenceBadges: string[];
  nextStep: string;
  reviewState: "Needs review" | "Reviewed" | "Saved" | "Applied" | "Hidden" | "Discovered";
  discoveredTime: number;
  isRemoteFit: boolean;
  isTrinidadFit: boolean;
};

const reviewStateRank: Record<DiscoveredJobRow["reviewState"], number> = {
  "Needs review": 0,
  Saved: 1,
  Discovered: 2,
  Reviewed: 3,
  Applied: 4,
  Hidden: 5
};

export function getDiscoveredJobReviewState(job: DiscoveredJobRowInput): DiscoveredJobRow["reviewState"] {
  if (job.hiddenBy?.length) return "Hidden";
  if (job.applications.length) return "Applied";
  if (job.savedBy.length) return "Saved";
  if (job.needsReview) return "Needs review";
  if (job.matches[0]?.reviewedAt) return "Reviewed";

  return "Discovered";
}

export function createDiscoveredJobRow(
  job: DiscoveredJobRowInput,
  explanation: ExplanationSnapshot
): DiscoveredJobRow {
  const discoveredAt = job.discoveredAt ? new Date(job.discoveredAt).getTime() : 0;

  return {
    job,
    sourceId: job.discoverySource?.id,
    sourceLabel: job.discoverySource?.name ?? job.sourceName,
    matchPercent: job.matches[0]?.matchPercent ?? 0,
    confidenceScore: explanation.confidence.overall,
    confidenceTier: explanation.confidence.tier,
    confidenceBadges: explanation.confidence.badges,
    nextStep: explanation.nextStep,
    reviewState: getDiscoveredJobReviewState(job),
    discoveredTime: Number.isNaN(discoveredAt) ? 0 : discoveredAt,
    isRemoteFit: job.isRemoteFriendly || job.workMode === "REMOTE",
    isTrinidadFit: job.isTrinidadAndTobago
  };
}

export function filterDiscoveredJobRows(
  rows: DiscoveredJobRow[],
  filters: {
    confidence?: DiscoveredJobConfidenceFilter;
    remoteOnly?: boolean;
    trinidadOnly?: boolean;
    highMatchOnly?: boolean;
    needsReviewOnly?: boolean;
    sourceId?: string;
  }
) {
  return rows.filter((row) => {
    if (filters.remoteOnly && !row.isRemoteFit) return false;
    if (filters.trinidadOnly && !row.isTrinidadFit) return false;
    if (filters.highMatchOnly && row.matchPercent < 80) return false;
    if (filters.needsReviewOnly && row.reviewState !== "Needs review") return false;
    if (filters.sourceId && row.sourceId !== filters.sourceId) return false;

    switch (filters.confidence) {
      case "high":
        return row.confidenceTier === "High Confidence";
      case "medium-plus":
        return row.confidenceScore >= 60;
      case "needs-work":
        return row.confidenceScore < 60;
      default:
        return true;
    }
  });
}

export function sortDiscoveredJobRows(rows: DiscoveredJobRow[], sort: DiscoveredJobSort = "priority") {
  return [...rows].sort((left, right) => {
    const matchDelta = right.matchPercent - left.matchPercent;
    const confidenceDelta = right.confidenceScore - left.confidenceScore;
    const discoveredDelta = right.discoveredTime - left.discoveredTime;
    const sourceDelta = left.sourceLabel.localeCompare(right.sourceLabel);
    const reviewDelta = reviewStateRank[left.reviewState] - reviewStateRank[right.reviewState];

    if (sort === "match") return matchDelta || confidenceDelta || discoveredDelta;
    if (sort === "confidence") return confidenceDelta || matchDelta || discoveredDelta;
    if (sort === "source") return sourceDelta || matchDelta || confidenceDelta;
    if (sort === "discovered") return discoveredDelta || matchDelta || confidenceDelta;
    if (sort === "review") return reviewDelta || matchDelta || confidenceDelta;

    return reviewDelta || confidenceDelta || matchDelta || discoveredDelta;
  });
}
