import { z } from "zod";

export const allowedResumeMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain"
];

export const resumeUploadSchema = z.object({
  fileName: z.string().min(3),
  mimeType: z.string().refine((value) => allowedResumeMimeTypes.includes(value), {
    message: "Only PDF, DOCX, DOC, and TXT resumes are supported."
  }),
  size: z.number().max(5 * 1024 * 1024, "Resume must be 5MB or smaller.")
});
