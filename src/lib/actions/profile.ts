"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { errorState, successState, type ActionState } from "@/lib/actions/shared";
import { prisma } from "@/lib/db/prisma";
import { recomputeJobMatchesForUser } from "@/lib/jobs/scoring";
import { parseDelimitedList } from "@/lib/utils";
import { profileSchema, resumeReviewSchema } from "@/lib/validations/profile";

export async function saveProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    headline: formData.get("headline"),
    yearsExperience: formData.get("yearsExperience"),
    desiredJobTitles: formData.get("desiredJobTitles"),
    preferredIndustries: formData.get("preferredIndustries"),
    preferredLocations: formData.get("preferredLocations"),
    workModes: formData.getAll("workModes"),
    minimumSalary: formData.get("minimumSalary") || undefined,
    seniorityLevels: formData.getAll("seniorityLevels"),
    topSkills: formData.get("topSkills"),
    certifications: formData.get("certifications"),
    degree: formData.get("degree"),
    includeKeywords: formData.get("includeKeywords"),
    excludeKeywords: formData.get("excludeKeywords"),
    targetCompanies: formData.get("targetCompanies"),
    avoidCompanies: formData.get("avoidCompanies"),
    prioritizeTrinidad: formData.get("prioritizeTrinidad") === "on",
    allowCaribbeanRemote: formData.get("allowCaribbeanRemote") === "on",
    autoHideEnabled: formData.get("autoHideEnabled") === "on"
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Unable to save your profile.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      headline: parsed.data.headline || null,
      yearsExperience: parsed.data.yearsExperience,
      onboardingComplete: true,
      preferences: {
        upsert: {
          update: {
            desiredJobTitles: parseDelimitedList(parsed.data.desiredJobTitles),
            preferredIndustries: parseDelimitedList(parsed.data.preferredIndustries),
            preferredLocations: parseDelimitedList(parsed.data.preferredLocations),
            workModes: parsed.data.workModes,
            minimumSalary: parsed.data.minimumSalary,
            seniorityLevels: parsed.data.seniorityLevels,
            topSkills: parseDelimitedList(parsed.data.topSkills),
            certifications: parseDelimitedList(parsed.data.certifications),
            degree: parsed.data.degree || null,
            includeKeywords: parseDelimitedList(parsed.data.includeKeywords),
            excludeKeywords: parseDelimitedList(parsed.data.excludeKeywords),
            targetCompanies: parseDelimitedList(parsed.data.targetCompanies),
            avoidCompanies: parseDelimitedList(parsed.data.avoidCompanies),
            prioritizeTrinidad: parsed.data.prioritizeTrinidad,
            allowCaribbeanRemote: parsed.data.allowCaribbeanRemote,
            autoHideEnabled: parsed.data.autoHideEnabled
          },
          create: {
            desiredJobTitles: parseDelimitedList(parsed.data.desiredJobTitles),
            preferredIndustries: parseDelimitedList(parsed.data.preferredIndustries),
            preferredLocations: parseDelimitedList(parsed.data.preferredLocations),
            workModes: parsed.data.workModes,
            minimumSalary: parsed.data.minimumSalary,
            seniorityLevels: parsed.data.seniorityLevels,
            topSkills: parseDelimitedList(parsed.data.topSkills),
            certifications: parseDelimitedList(parsed.data.certifications),
            degree: parsed.data.degree || null,
            includeKeywords: parseDelimitedList(parsed.data.includeKeywords),
            excludeKeywords: parseDelimitedList(parsed.data.excludeKeywords),
            targetCompanies: parseDelimitedList(parsed.data.targetCompanies),
            avoidCompanies: parseDelimitedList(parsed.data.avoidCompanies),
            prioritizeTrinidad: parsed.data.prioritizeTrinidad,
            allowCaribbeanRemote: parsed.data.allowCaribbeanRemote,
            autoHideEnabled: parsed.data.autoHideEnabled
          }
        }
      }
    }
  });

  await recomputeJobMatchesForUser(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/onboarding");

  const redirectTo = formData.get("redirectTo");

  if (typeof redirectTo === "string" && redirectTo) {
    redirect(redirectTo);
  }

  return successState("Profile saved.");
}

export async function saveResumeReviewAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId") ?? "");

  const parsed = resumeReviewSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    summary: formData.get("summary"),
    yearsExperience: formData.get("yearsExperience"),
    technicalSkills: formData.get("technicalSkills"),
    softSkills: formData.get("softSkills"),
    toolsPlatforms: formData.get("toolsPlatforms"),
    certifications: formData.get("certifications"),
    education: formData.get("education"),
    jobHistory: formData.get("jobHistory"),
    projects: formData.get("projects"),
    keywords: formData.get("keywords"),
    reviewNotes: formData.get("reviewNotes")
  });

  if (!resumeId || !parsed.success) {
    return errorState(parsed.success ? "Resume record was not found." : parsed.error.issues[0]?.message ?? "Unable to save resume review.");
  }

  await prisma.extractedResumeData.update({
    where: { resumeId },
    data: {
      fullName: parsed.data.fullName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      summary: parsed.data.summary || null,
      yearsExperience: parsed.data.yearsExperience,
      technicalSkills: parseDelimitedList(parsed.data.technicalSkills),
      softSkills: parseDelimitedList(parsed.data.softSkills),
      toolsPlatforms: parseDelimitedList(parsed.data.toolsPlatforms),
      certifications: parseDelimitedList(parsed.data.certifications),
      education: parseDelimitedList(parsed.data.education).map((item) => ({ school: item })),
      jobHistory: parseDelimitedList(parsed.data.jobHistory).map((item) => ({ heading: item })),
      projects: parseDelimitedList(parsed.data.projects).map((item) => ({ name: item })),
      keywords: parseDelimitedList(parsed.data.keywords),
      reviewNotes: parsed.data.reviewNotes || null
    }
  });

  await prisma.resume.update({
    where: { id: resumeId, userId: user.id },
    data: {
      status: "REVIEWED"
    }
  });

  await recomputeJobMatchesForUser(user.id);
  revalidatePath("/resume");
  revalidatePath("/dashboard");

  return successState("Resume review saved.");
}
