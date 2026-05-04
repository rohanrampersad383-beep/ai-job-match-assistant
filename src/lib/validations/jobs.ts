import { z } from "zod";

export const manualJobSchema = z.object({
  sourceType: z.enum(["MANUAL_URL", "MANUAL_TEXT"]),
  sourceName: z.string().min(2).max(80),
  sourceReference: z.string().optional(),
  title: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  seniorityLevel: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"])
    .optional(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  salaryCurrency: z.string().default("USD"),
  description: z.string().min(40),
  requiredSkills: z.string().default(""),
  preferredSkills: z.string().default(""),
  requiredYearsExperience: z.coerce.number().min(0).max(50).optional(),
  educationRequirements: z.string().optional(),
  keywords: z.string().default(""),
  applicationUrl: z.string().url(),
  postedAt: z.string().optional()
});

export const rssImportSchema = z.object({
  feedUrl: z.string().url(),
  sourceName: z.string().min(2).max(80)
});

