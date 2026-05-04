"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus, InterviewStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function updateApplicationAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");

  if (!applicationId) {
    return;
  }

  await prisma.application.updateMany({
    where: {
      id: applicationId,
      userId: user.id
    },
    data: {
      status: String(formData.get("status") ?? "PREPARING") as ApplicationStatus,
      interviewStatus: String(formData.get("interviewStatus") ?? "NONE") as InterviewStatus,
      followUpDate: formData.get("followUpDate")
        ? new Date(String(formData.get("followUpDate")))
        : null,
      notes: String(formData.get("notes") ?? "") || null
    }
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
}
