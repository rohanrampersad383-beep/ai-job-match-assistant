"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { generateApplicationDrafts } from "@/lib/applications/generator";
import { prisma } from "@/lib/db/prisma";

export async function saveJobAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    return;
  }

  await prisma.savedJob.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId
      }
    },
    update: {},
    create: {
      userId: user.id,
      jobId
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  revalidatePath(`/jobs/${jobId}`);
}

export async function hideJobAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    return;
  }

  await prisma.hiddenJob.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId
      }
    },
    update: {
      reason: "User hidden from dashboard"
    },
    create: {
      userId: user.id,
      jobId,
      reason: "User hidden from dashboard"
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  revalidatePath(`/jobs/${jobId}`);
}

export async function markReviewedAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    return;
  }

  const reviewedAt = new Date();

  await prisma.jobMatch.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId
      }
    },
    update: {
      reviewedAt
    },
    create: {
      userId: user.id,
      jobId,
      reviewedAt,
      reasons: [],
      matchedSkills: [],
      missingSkills: [],
      penalties: []
    }
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      needsReview: false
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  revalidatePath(`/jobs/${jobId}`);
}

export async function markAppliedAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    return;
  }

  await prisma.application.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId
      }
    },
    update: {
      status: "APPLIED",
      appliedAt: new Date(),
      companySnapshot: job.company,
      titleSnapshot: job.title
    },
    create: {
      userId: user.id,
      jobId,
      status: "APPLIED",
      appliedAt: new Date(),
      companySnapshot: job.company,
      titleSnapshot: job.title
    }
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      needsReview: false
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath("/review-queue");
  revalidatePath(`/jobs/${jobId}`);
}

export async function generateDraftsAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    return;
  }

  await generateApplicationDrafts(user.id, jobId);
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    return;
  }

  await prisma.application.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId
      }
    },
    update: {
      status: "PREPARING"
    },
    create: {
      userId: user.id,
      jobId,
      status: "PREPARING",
      companySnapshot: job.company,
      titleSnapshot: job.title
    }
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/applications");
  revalidatePath("/review-queue");
}
