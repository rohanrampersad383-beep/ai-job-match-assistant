import { z } from "zod";

export const discoverySourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  sourceType: z.enum(["RSS", "API", "HTML", "CSV", "MANUAL"]),
  baseUrl: z.string().url(),
  publicUrl: z.string().url().optional().or(z.literal("")),
  fetchStrategy: z.string().min(2).max(120),
  parserKey: z.string().min(2).max(120),
  legalNotes: z.string().min(8),
  defaultTags: z.string().default(""),
  regionTags: z.string().default(""),
  pollingIntervalMinutes: z.coerce.number().min(5).max(10080),
  dedupeStrategy: z.string().min(2).max(140),
  enabled: z.boolean().default(true),
  configJson: z.string().default("{}")
});

