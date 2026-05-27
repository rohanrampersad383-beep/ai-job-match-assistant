import { prisma } from "@/lib/db/prisma";
import { syncRecommendedDiscoverySources } from "@/lib/discovery/default-sources";

export async function getSourcesData() {
  await syncRecommendedDiscoverySources();

  return prisma.discoverySource.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      runs: {
        orderBy: {
          startedAt: "desc"
        },
        take: 1
      },
      logs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 2
      },
      errors: {
        orderBy: {
          createdAt: "desc"
        },
        take: 2
      },
      _count: {
        select: {
          normalizedJobs: true,
          errors: true
        }
      }
    }
  });
}

export async function getDiscoverySourceOptions() {
  return prisma.discoverySource.findMany({
    where: {
      enabled: true
    },
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });
}

export async function getDiscoveryRunsData() {
  return prisma.sourceRun.findMany({
    orderBy: {
      startedAt: "desc"
    },
    take: 40,
    include: {
      source: true,
      logs: {
        take: 3,
        orderBy: {
          createdAt: "desc"
        }
      },
      errors: {
        take: 3,
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export async function getReviewQueueData(
  userId: string,
  options?: {
    trinidadOnly?: boolean;
    remoteOnly?: boolean;
    recentDays?: number;
    sourceId?: string;
    query?: string;
  }
) {
  const where = {
    isDiscoveredAutomatically: true,
    needsReview: true,
    ...(options?.trinidadOnly ? { isTrinidadAndTobago: true } : {}),
    ...(options?.remoteOnly ? { isRemoteFriendly: true } : {}),
    ...(options?.sourceId ? { discoverySourceId: options.sourceId } : {}),
    ...(options?.recentDays
      ? {
          discoveredAt: {
            gte: new Date(Date.now() - options.recentDays * 24 * 60 * 60 * 1000)
          }
        }
      : {})
  } as const;

  return prisma.job.findMany({
    where: {
      ...where,
      ...(options?.query
        ? {
            OR: [
              { title: { contains: options.query, mode: "insensitive" } },
              { company: { contains: options.query, mode: "insensitive" } },
              { location: { contains: options.query, mode: "insensitive" } },
              { sourceName: { contains: options.query, mode: "insensitive" } }
            ]
          }
        : {}),
      hiddenBy: {
        none: {
          userId
        }
      },
      matches: {
        some: {
          userId
        }
      }
    },
    include: {
      discoverySource: true,
      matches: {
        where: { userId },
        take: 1
      },
      savedBy: {
        where: { userId },
        take: 1
      },
      applications: {
        where: { userId },
        take: 1
      }
    },
    orderBy: [
      {
        discoveredAt: "desc"
      },
      {
        postedAt: "desc"
      }
    ],
    take: 50
  });
}
