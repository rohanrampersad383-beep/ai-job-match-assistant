import { DocumentType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { sanitizeText } from "@/lib/utils";

function bulletFromHistory(history: unknown) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const entry = item as Record<string, unknown>;
      return sanitizeText(
        `${entry.heading ?? ""}. ${entry.summary ?? ""}`.replace(/\s+/g, " ")
      );
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 4);
}

export async function generateApplicationDrafts(userId: string, jobId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      resumes: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          extractedData: true
        }
      }
    }
  });

  const job = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!user || !job) {
    throw new Error("Unable to generate documents without a user and job.");
  }

  const latestResume = user.resumes.find((resume) => resume.extractedData);
  const extractedData = latestResume?.extractedData;
  const strengths = [
    ...(user.preferences?.topSkills ?? []),
    ...(extractedData?.technicalSkills ?? [])
  ].slice(0, 6);
  const experienceBullets = bulletFromHistory(extractedData?.jobHistory);
  const fullName = extractedData?.fullName ?? user.fullName;

  const coverLetter = `Dear Hiring Team,\n\nI am applying for the ${job.title} role at ${job.company}. Based on my resume and profile, I bring experience that aligns with the role requirements, especially in ${strengths.join(", ") || "software delivery and cross-functional execution"}.\n\nIn my recent work, I have focused on ${experienceBullets[0] ?? "building and improving production-ready software"} and related responsibilities that match the practical demands of this role. I am particularly interested in this opportunity because it combines ${job.requiredSkills.slice(0, 3).join(", ") || "technical problem solving"} with the kind of ownership I want in my next position.\n\nI would welcome the opportunity to discuss how my background can support ${job.company}'s goals. Thank you for your time and consideration.\n\nSincerely,\n${fullName}`;

  const professionalSummary = `${fullName} is a candidate with ${Math.max(
    extractedData?.yearsExperience ?? user.yearsExperience,
    1
  )}+ years of experience across ${strengths.join(", ") || "software engineering"} seeking ${job.title} opportunities. This draft summary is based only on the resume/profile data already provided and can be edited before use.`;

  const resumeBulletSuggestions = [
    "Editable draft suggestions:",
    ...experienceBullets.map((bullet) => `- Emphasize: ${bullet}`),
    `- Highlight alignment with ${job.requiredSkills.slice(0, 4).join(", ") || "the core job requirements"}.`,
    `- Mention outcomes or metrics relevant to ${job.company}'s ${job.title} role where your actual experience supports them.`
  ].join("\n");

  const applicationAnswers = [
    "Editable draft answers:",
    `1. Why are you interested in this role?\nI am interested in the ${job.title} role because it matches my background in ${strengths.join(", ") || "software engineering"} and the type of work described in the job posting.`,
    `2. What makes you a strong fit?\nMy resume shows relevant experience across ${job.requiredSkills.slice(0, 4).join(", ") || "the listed technologies"}, and I can point to prior work that reflects those responsibilities without overstating my background.`,
    "3. Anything else to add?\nI am open to tailoring my resume and discussing the parts of my experience that best map to this role."
  ].join("\n\n");

  const documents = [
    {
      type: DocumentType.COVER_LETTER,
      title: `${job.company} cover letter draft`,
      content: coverLetter
    },
    {
      type: DocumentType.PROFESSIONAL_SUMMARY,
      title: `${job.company} tailored summary`,
      content: professionalSummary
    },
    {
      type: DocumentType.RESUME_BULLET_SUGGESTIONS,
      title: `${job.company} resume emphasis bullets`,
      content: resumeBulletSuggestions
    },
    {
      type: DocumentType.APPLICATION_ANSWERS,
      title: `${job.company} application answer draft`,
      content: applicationAnswers
    }
  ];

  await prisma.generatedDocument.deleteMany({
    where: {
      userId,
      jobId
    }
  });

  await prisma.generatedDocument.createMany({
    data: documents.map((document) => ({
      userId,
      jobId,
      resumeId: latestResume?.id,
      type: document.type,
      title: document.title,
      content: document.content,
      metadata: {
        editable: true,
        generatedFromResume: latestResume?.id ?? null
      }
    }))
  });

  return documents;
}
