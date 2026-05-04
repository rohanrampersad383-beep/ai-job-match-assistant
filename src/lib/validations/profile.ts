import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
  headline: z.string().max(140).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().min(0).max(50),
  desiredJobTitles: z.string().default(""),
  preferredIndustries: z.string().default(""),
  preferredLocations: z.string().default(""),
  workModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).default([]),
  minimumSalary: z.coerce.number().min(0).max(1_000_000).optional(),
  seniorityLevels: z
    .array(z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"]))
    .default([]),
  topSkills: z.string().default(""),
  certifications: z.string().default(""),
  degree: z.string().max(120).optional().or(z.literal("")),
  includeKeywords: z.string().default(""),
  excludeKeywords: z.string().default(""),
  targetCompanies: z.string().default(""),
  avoidCompanies: z.string().default(""),
  prioritizeTrinidad: z.boolean().default(true),
  allowCaribbeanRemote: z.boolean().default(true),
  autoHideEnabled: z.boolean().default(false)
});

export const resumeReviewSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).max(50),
  technicalSkills: z.string().default(""),
  softSkills: z.string().default(""),
  toolsPlatforms: z.string().default(""),
  certifications: z.string().default(""),
  education: z.string().default(""),
  jobHistory: z.string().default(""),
  projects: z.string().default(""),
  keywords: z.string().default(""),
  reviewNotes: z.string().optional()
});
