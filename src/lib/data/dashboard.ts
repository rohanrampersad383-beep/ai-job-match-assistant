import { Prisma } from "@prisma/client";

import type { DashboardFilters } from "@/types";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 8;

function buildDashboardWhere(userId: string, filters: DashboardFilters, autoHideMinMatchPercent?: number) {
  const and: Prisma.JobWhereInput[] = [];
  const matchWhere: Prisma.JobMatchWhereInput = {
    userId
  };

  let minimumMatch = filters.minMatch;

  if (filters.view === "high-match") {
    minimumMatch = Math.max(minimumMatch ?? 0, 80);
  }

  if (filters.view === "reviewed") {
    matchWhere.reviewedAt = { not: null };
  }

  if (
    (filters.view === "all" || !filters.view || filters.view === "needs-review" || filters.view === "high-match") &&
    typeof autoHideMinMatchPercent === "number"
  ) {
    minimumMatch = Math.max(minimumMatch ?? 0, autoHideMinMatchPercent);
  }

  if (typeof minimumMatch === "number") {
    matchWhere.matchPercent = { gte: minimumMatch };
  }

  and.push({
    matches: {
      some: matchWhere
    }
  });

  if (filters.query) {
    and.push({
      OR: [
        { title: { contains: filters.query, mode: "insensitive" } },
        { company: { contains: filters.query, mode: "insensitive" } },
        { location: { contains: filters.query, mode: "insensitive" } },
        { sourceName: { contains: filters.query, mode: "insensitive" } },
        { requiredSkills: { hasSome: [filters.query] } },
        { preferredSkills: { hasSome: [filters.query] } }
      ]
    });
  }

  if (filters.workMode && filters.workMode !== "ALL") {
    and.push({ workMode: filters.workMode });
  }

  if (filters.seniority && filters.seniority !== "ALL") {
    and.push({ seniorityLevel: filters.seniority });
  }

  if (filters.sourceId) {
    and.push({ discoverySourceId: filters.sourceId });
  }

  if (filters.discoveredOnly) {
    and.push({ isDiscoveredAutomatically: true });
  }

  if (filters.trinidadOnly) {
    and.push({ isTrinidadAndTobago: true });
  }

  if (filters.remoteFriendlyOnly) {
    and.push({ isRemoteFriendly: true });
  }

  if (typeof filters.recentDays === "number" && filters.recentDays > 0) {
    and.push({
      discoveredAt: {
        gte: new Date(Date.now() - filters.recentDays * 24 * 60 * 60 * 1000)
      }
    });
  }

  switch (filters.view) {
    case "saved":
      and.push({ savedBy: { some: { userId } } });
      break;
    case "hidden":
      and.push({ hiddenBy: { some: { userId } } });
      break;
    case "applied":
      and.push({ applications: { some: { userId } } });
      break;
    case "needs-review":
      and.push({ needsReview: true });
      and.push({ hiddenBy: { none: { userId } } });
      break;
    case "reviewed":
      break;
    case "high-match":
      and.push({ hiddenBy: { none: { userId } } });
      break;
    default:
      and.push({ hiddenBy: { none: { userId } } });
  }

  return and.length ? { AND: and } : {};
}

export async function getDashboardData(userId: string, filters: DashboardFilters) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      scoringSettings: true
    }
  });

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const autoHideMinMatchPercent = user?.preferences?.autoHideEnabled
    ? user?.scoringSettings?.autoHideMinMatchPercent ?? 25
    : undefined;

  const where = buildDashboardWhere(userId, filters, autoHideMinMatchPercent);

  const baseVisibleWhere: Prisma.JobWhereInput = {
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

  const [jobs, total, stats, sources, newJobsCount, trinidadJobsCount, remoteJobsCount, highMatchJobsCount, needsReviewCount] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [
        {
          matches: {
            _count: "desc"
          }
        },
        {
          postedAt: "desc"
        }
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
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
        },
        discoverySource: {
          select: {
            id: true,
            name: true,
            sourceType: true
          }
        }
      }
    }),
    prisma.job.count({ where }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            savedJobs: true,
            hiddenJobs: true,
            applications: true,
            jobMatches: true
          }
        },
        jobMatches: {
          take: 3,
          orderBy: {
            matchPercent: "desc"
          },
          select: {
            matchPercent: true,
            reviewedAt: true
          }
        }
      }
    }),
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
        isDiscoveredAutomatically: true,
        discoveredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
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
        OR: [{ isRemoteFriendly: true }, { workMode: "REMOTE" }]
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
        needsReview: true
      }
    })
  ]);

  return {
    user,
    jobs,
    total,
    page,
    totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
    stats,
    sources,
    summary: {
      newJobs: newJobsCount,
      trinidadJobs: trinidadJobsCount,
      remoteJobs: remoteJobsCount,
      highMatchJobs: highMatchJobsCount,
      needsReview: needsReviewCount
    }
  };
}

export async function getJobDetailData(userId: string, jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
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
      },
      discoverySource: true,
      tags: {
        orderBy: {
          label: "asc"
        }
      },
      generatedDocuments: {
        where: { userId },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export async function getApplicationTracker(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: [
      {
        appliedAt: "desc"
      },
      {
        updatedAt: "desc"
      }
    ],
    include: {
      job: true
    }
  });
}

export async function getResumeWorkspace(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      extractedData: true
    }
  });
}
