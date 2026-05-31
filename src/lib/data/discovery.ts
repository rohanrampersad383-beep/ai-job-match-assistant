import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { syncRecommendedDiscoverySources } from "@/lib/discovery/default-sources";

export type DiscoveredJobsDataOptions = {
  query?: string;
  sourceId?: string;
  status?: "all" | "needs-review" | "reviewed" | "saved" | "applied" | "hidden";
  remoteOnly?: boolean;
  trinidadOnly?: boolean;
  highMatchOnly?: boolean;
  recentDays?: number;
};

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

export async function getDiscoveredJobsData(userId: string, options?: DiscoveredJobsDataOptions) {
  const matchWhere: Prisma.JobMatchWhereInput = {
    userId,
    ...(options?.highMatchOnly ? { matchPercent: { gte: 80 } } : {})
  };
  const and: Prisma.JobWhereInput[] = [
    { isDiscoveredAutomatically: true },
    {
      matches: {
        some: matchWhere
      }
    }
  ];

  if (options?.query) {
    and.push({
      OR: [
        { title: { contains: options.query, mode: "insensitive" } },
        { company: { contains: options.query, mode: "insensitive" } },
        { location: { contains: options.query, mode: "insensitive" } },
        { sourceName: { contains: options.query, mode: "insensitive" } },
        { requiredSkills: { hasSome: [options.query] } },
        { preferredSkills: { hasSome: [options.query] } }
      ]
    });
  }

  if (options?.sourceId) {
    and.push({ discoverySourceId: options.sourceId });
  }

  if (options?.remoteOnly) {
    and.push({
      OR: [{ isRemoteFriendly: true }, { workMode: "REMOTE" }]
    });
  }

  if (options?.trinidadOnly) {
    and.push({ isTrinidadAndTobago: true });
  }

  if (typeof options?.recentDays === "number" && options.recentDays > 0) {
    and.push({
      discoveredAt: {
        gte: new Date(Date.now() - options.recentDays * 24 * 60 * 60 * 1000)
      }
    });
  }

  switch (options?.status) {
    case "needs-review":
      and.push({ needsReview: true });
      and.push({ hiddenBy: { none: { userId } } });
      break;
    case "reviewed":
      and.push({ matches: { some: { userId, reviewedAt: { not: null } } } });
      and.push({ hiddenBy: { none: { userId } } });
      break;
    case "saved":
      and.push({ savedBy: { some: { userId } } });
      and.push({ hiddenBy: { none: { userId } } });
      break;
    case "applied":
      and.push({ applications: { some: { userId } } });
      and.push({ hiddenBy: { none: { userId } } });
      break;
    case "hidden":
      and.push({ hiddenBy: { some: { userId } } });
      break;
    default:
      and.push({ hiddenBy: { none: { userId } } });
  }

  const where = {
    AND: and
  };

  const baseVisibleWhere: Prisma.JobWhereInput = {
    isDiscoveredAutomatically: true,
    matches: {
      some: {
        userId
      }
    },
    hiddenBy: {
      none: {
        userId
      }
    }
  };

  const [jobs, total, sources, needsReviewCount, highMatchCount, remoteCount, trinidadCount, reviewedCount] =
    await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          discoverySource: {
            select: {
              id: true,
              name: true,
              sourceType: true
            }
          },
          matches: {
            where: { userId },
            take: 1
          },
          savedBy: {
            where: { userId },
            take: 1
          },
          hiddenBy: {
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
        take: 120
      }),
      prisma.job.count({ where }),
      prisma.discoverySource.findMany({
        where: { enabled: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true
        }
      }),
      prisma.job.count({
        where: {
          ...baseVisibleWhere,
          needsReview: true
        }
      }),
      prisma.job.count({
        where: {
          ...baseVisibleWhere,
          matches: {
            some: {
              userId,
              matchPercent: {
                gte: 80
              }
            }
          }
        }
      }),
      prisma.job.count({
        where: {
          ...baseVisibleWhere,
          OR: [{ isRemoteFriendly: true }, { workMode: "REMOTE" }]
        }
      }),
      prisma.job.count({
        where: {
          ...baseVisibleWhere,
          isTrinidadAndTobago: true
        }
      }),
      prisma.job.count({
        where: {
          ...baseVisibleWhere,
          matches: {
            some: {
              userId,
              reviewedAt: {
                not: null
              }
            }
          }
        }
      })
    ]);

  return {
    jobs,
    total,
    sources,
    summary: {
      needsReview: needsReviewCount,
      highMatch: highMatchCount,
      remote: remoteCount,
      trinidad: trinidadCount,
      reviewed: reviewedCount
    }
  };
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
