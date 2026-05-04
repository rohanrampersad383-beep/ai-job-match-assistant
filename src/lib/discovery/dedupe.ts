import type { Prisma, PrismaClient } from "@prisma/client";

import type { NormalizedDiscoveredJob } from "@/lib/discovery/types";

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

export function calculateDescriptionSimilarity(left: string, right: string) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

export async function resolveDedupeGroup(
  tx: Prisma.TransactionClient | PrismaClient,
  normalized: NormalizedDiscoveredJob
) {
  const exactGroup = await tx.dedupeGroup.findUnique({
    where: {
      groupKey: normalized.dedupeKey
    }
  });

  if (exactGroup) {
    return {
      group: exactGroup,
      isLikelyDuplicate: Boolean(exactGroup.canonicalNormalizedJobId),
      similarityScore: 1,
      reason: "exact_dedupe_key"
    };
  }

  const candidates = await tx.discoveredJobNormalized.findMany({
    where: {
      company: normalized.company,
      title: normalized.title,
      locationText: normalized.locationText
    },
    include: {
      dedupeGroup: true
    },
    take: 10
  });

  for (const candidate of candidates) {
    const similarity = calculateDescriptionSimilarity(candidate.description, normalized.description);

    if (similarity >= 0.72 && candidate.dedupeGroup) {
      return {
        group: candidate.dedupeGroup,
        isLikelyDuplicate: true,
        similarityScore: similarity,
        reason: "description_similarity"
      };
    }
  }

  const group = await tx.dedupeGroup.create({
    data: {
      groupKey: normalized.dedupeKey,
      reason: "new_group",
      confidence: 1
    }
  });

  return {
    group,
    isLikelyDuplicate: false,
    similarityScore: 1,
    reason: "new_group"
  };
}
