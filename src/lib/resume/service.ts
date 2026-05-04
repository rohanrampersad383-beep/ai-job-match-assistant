import { prisma } from "@/lib/db/prisma";
import { recomputeJobMatchesForUser } from "@/lib/jobs/scoring";
import type { ParsedResume } from "@/types";

export async function storeParsedResume(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  rawText: string;
  parsedResume: ParsedResume;
}) {
  const resume = await prisma.resume.create({
    data: {
      userId: params.userId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      status: "PARSED",
      rawText: params.rawText,
      extractedData: {
        create: {
          userId: params.userId,
          fullName: params.parsedResume.fullName,
          email: params.parsedResume.email,
          phone: params.parsedResume.phone,
          location: params.parsedResume.location,
          summary: params.parsedResume.summary,
          yearsExperience: params.parsedResume.yearsExperience,
          education: params.parsedResume.education,
          jobHistory: params.parsedResume.jobHistory,
          technicalSkills: params.parsedResume.technicalSkills,
          softSkills: params.parsedResume.softSkills,
          toolsPlatforms: params.parsedResume.toolsPlatforms,
          certifications: params.parsedResume.certifications,
          projects: params.parsedResume.projects,
          keywords: params.parsedResume.keywords,
          contactLinks: params.parsedResume.contactLinks
        }
      }
    },
    include: {
      extractedData: true
    }
  });

  await recomputeJobMatchesForUser(params.userId);
  return resume;
}

