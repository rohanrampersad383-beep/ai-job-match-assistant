"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { errorState, successState, type ActionState } from "@/lib/actions/shared";
import { prisma } from "@/lib/db/prisma";
import { recomputeJobMatchesForUser } from "@/lib/jobs/scoring";
import { parseDelimitedList } from "@/lib/utils";
import { scoringSettingsSchema } from "@/lib/validations/settings";

export async function saveScoringSettingsAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = scoringSettingsSchema.safeParse({
    titleWeight: formData.get("titleWeight"),
    skillsWeight: formData.get("skillsWeight"),
    experienceWeight: formData.get("experienceWeight"),
    educationWeight: formData.get("educationWeight"),
    locationWeight: formData.get("locationWeight"),
    remoteWeight: formData.get("remoteWeight"),
    trinidadBoostWeight: formData.get("trinidadBoostWeight"),
    sourceTrustWeight: formData.get("sourceTrustWeight"),
    salaryWeight: formData.get("salaryWeight"),
    certificationsWeight: formData.get("certificationsWeight"),
    keywordWeight: formData.get("keywordWeight"),
    blacklistPenalty: formData.get("blacklistPenalty"),
    mismatchPenalty: formData.get("mismatchPenalty"),
    targetJobFamilies: formData.get("targetJobFamilies"),
    includeKeywords: formData.get("includeKeywords"),
    excludeKeywords: formData.get("excludeKeywords"),
    autoHideMinMatchPercent: formData.get("autoHideMinMatchPercent")
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Unable to save scoring settings.");
  }

  await prisma.scoringSetting.upsert({
    where: { userId: user.id },
    update: {
      titleWeight: parsed.data.titleWeight,
      skillsWeight: parsed.data.skillsWeight,
      experienceWeight: parsed.data.experienceWeight,
      educationWeight: parsed.data.educationWeight,
      locationWeight: parsed.data.locationWeight,
      remoteWeight: parsed.data.remoteWeight,
      trinidadBoostWeight: parsed.data.trinidadBoostWeight,
      sourceTrustWeight: parsed.data.sourceTrustWeight,
      salaryWeight: parsed.data.salaryWeight,
      certificationsWeight: parsed.data.certificationsWeight,
      keywordWeight: parsed.data.keywordWeight,
      blacklistPenalty: parsed.data.blacklistPenalty,
      mismatchPenalty: parsed.data.mismatchPenalty,
      targetJobFamilies: parseDelimitedList(parsed.data.targetJobFamilies),
      includeKeywords: parseDelimitedList(parsed.data.includeKeywords),
      excludeKeywords: parseDelimitedList(parsed.data.excludeKeywords),
      autoHideMinMatchPercent: parsed.data.autoHideMinMatchPercent
    },
    create: {
      userId: user.id,
      titleWeight: parsed.data.titleWeight,
      skillsWeight: parsed.data.skillsWeight,
      experienceWeight: parsed.data.experienceWeight,
      educationWeight: parsed.data.educationWeight,
      locationWeight: parsed.data.locationWeight,
      remoteWeight: parsed.data.remoteWeight,
      trinidadBoostWeight: parsed.data.trinidadBoostWeight,
      sourceTrustWeight: parsed.data.sourceTrustWeight,
      salaryWeight: parsed.data.salaryWeight,
      certificationsWeight: parsed.data.certificationsWeight,
      keywordWeight: parsed.data.keywordWeight,
      blacklistPenalty: parsed.data.blacklistPenalty,
      mismatchPenalty: parsed.data.mismatchPenalty,
      targetJobFamilies: parseDelimitedList(parsed.data.targetJobFamilies),
      includeKeywords: parseDelimitedList(parsed.data.includeKeywords),
      excludeKeywords: parseDelimitedList(parsed.data.excludeKeywords),
      autoHideMinMatchPercent: parsed.data.autoHideMinMatchPercent
    }
  });

  await recomputeJobMatchesForUser(user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return successState("Scoring settings saved.");
}
