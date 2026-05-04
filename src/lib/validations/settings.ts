import { z } from "zod";

export const scoringSettingsSchema = z.object({
  titleWeight: z.coerce.number().min(0).max(100),
  skillsWeight: z.coerce.number().min(0).max(100),
  experienceWeight: z.coerce.number().min(0).max(100),
  educationWeight: z.coerce.number().min(0).max(100),
  locationWeight: z.coerce.number().min(0).max(100),
  remoteWeight: z.coerce.number().min(0).max(100),
  trinidadBoostWeight: z.coerce.number().min(0).max(100),
  sourceTrustWeight: z.coerce.number().min(0).max(100),
  salaryWeight: z.coerce.number().min(0).max(100),
  certificationsWeight: z.coerce.number().min(0).max(100),
  keywordWeight: z.coerce.number().min(0).max(100),
  blacklistPenalty: z.coerce.number().min(0).max(100),
  mismatchPenalty: z.coerce.number().min(0).max(100),
  targetJobFamilies: z.string().default(""),
  includeKeywords: z.string().default(""),
  excludeKeywords: z.string().default(""),
  autoHideMinMatchPercent: z.coerce.number().min(0).max(100)
});
