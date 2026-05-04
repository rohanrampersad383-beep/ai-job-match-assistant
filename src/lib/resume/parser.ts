import mammoth from "mammoth";
import pdfParse from "pdf-parse";

import type { ParsedResume, ResumeEducationItem, ResumeJobHistoryItem } from "@/types";
import { sanitizeText, uniqueArray } from "@/lib/utils";
import { resumeUploadSchema } from "@/lib/validations/resume";

const SECTION_HEADERS = [
  "summary",
  "profile",
  "experience",
  "work experience",
  "employment",
  "education",
  "skills",
  "technical skills",
  "certifications",
  "projects"
];

const SOFT_SKILL_SET = new Set([
  "communication",
  "leadership",
  "teamwork",
  "collaboration",
  "problem solving",
  "mentoring",
  "stakeholder management",
  "adaptability",
  "time management"
]);

export async function extractTextFromResumeFile(file: File) {
  resumeUploadSchema.parse({
    fileName: file.name,
    mimeType: file.type,
    size: file.size
  });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf8");
}

function findSectionContent(rawText: string, sectionName: string) {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\n)${escaped}\\s*\\n([\\s\\S]*?)(?=\\n(?:${SECTION_HEADERS
      .map((header) => header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\s*\\n|$)`,
    "i"
  );

  return rawText.match(pattern)?.[1]?.trim() ?? "";
}

function extractContactLinks(rawText: string) {
  const links = Array.from(rawText.matchAll(/https?:\/\/[^\s)]+/gi)).map((match) => match[0]);

  return uniqueArray(links).map((url) => ({
    label: url.includes("linkedin") ? "LinkedIn" : url.includes("github") ? "GitHub" : "Link",
    url
  }));
}

function extractLikelyName(rawText: string) {
  const firstLines = rawText
    .split("\n")
    .map((line) => sanitizeText(line))
    .filter(Boolean)
    .slice(0, 4);

  return firstLines.find((line) => !line.includes("@") && !/\d/.test(line) && line.length <= 60);
}

function extractYearsExperience(rawText: string) {
  const explicitMatches = Array.from(rawText.matchAll(/(\d{1,2})\+?\s+years/gi)).map((match) =>
    Number.parseInt(match[1], 10)
  );

  if (explicitMatches.length > 0) {
    return Math.max(...explicitMatches);
  }

  const experienceSection = findSectionContent(rawText, "experience") || rawText;
  const yearMatches = Array.from(experienceSection.matchAll(/\b(20\d{2}|19\d{2})\b/g)).map((match) =>
    Number.parseInt(match[1], 10)
  );

  if (yearMatches.length < 2) {
    return 0;
  }

  return Math.max(new Date().getFullYear() - Math.min(...yearMatches), 0);
}

function parseListSection(section: string) {
  return uniqueArray(
    section
      .split(/\n|,|•|·|\|/)
      .map((item) => sanitizeText(item))
      .filter((item) => item.length >= 2)
  );
}

function parseEducation(section: string): ResumeEducationItem[] {
  return section
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((block) => {
      const lines = block.split("\n").map((line) => sanitizeText(line)).filter(Boolean);
      return {
        school: lines[0],
        degree: lines[1],
        details: lines.slice(2).join(" ")
      };
    });
}

function parseJobHistory(section: string): ResumeJobHistoryItem[] {
  return section
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((block) => {
      const lines = block.split("\n").map((line) => sanitizeText(line)).filter(Boolean);
      const heading = lines[0];
      const periodMatch = block.match(
        /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}\s*(?:-|–|to)\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4})/i
      );
      return {
        heading,
        company: lines[1],
        period: periodMatch?.[0],
        summary: lines.slice(2).join(" ")
      };
    });
}

function extractKeywords(rawText: string) {
  const tokens = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);

  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return Array.from(frequencies.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 15)
    .map(([token]) => token);
}

export function parseResumeText(rawText: string): ParsedResume {
  const normalizedText = rawText
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u2022/g, "•")
    .replace(/\n{3,}/g, "\n\n");

  const summarySection = findSectionContent(normalizedText, "summary");
  const skillsSection =
    findSectionContent(normalizedText, "technical skills") ||
    findSectionContent(normalizedText, "skills");
  const educationSection = findSectionContent(normalizedText, "education");
  const experienceSection =
    findSectionContent(normalizedText, "work experience") ||
    findSectionContent(normalizedText, "experience");
  const certificationSection = findSectionContent(normalizedText, "certifications");
  const projectsSection = findSectionContent(normalizedText, "projects");

  const allSkills = parseListSection(skillsSection);
  const technicalSkills = allSkills.filter((skill) => !SOFT_SKILL_SET.has(skill.toLowerCase()));
  const softSkills = allSkills.filter((skill) => SOFT_SKILL_SET.has(skill.toLowerCase()));

  return {
    fullName: extractLikelyName(normalizedText),
    email: normalizedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0],
    phone: normalizedText.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0],
    location: normalizedText.match(/(?:[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)+)/)?.[0],
    summary: sanitizeText(summarySection).slice(0, 500),
    yearsExperience: extractYearsExperience(normalizedText),
    education: parseEducation(educationSection),
    jobHistory: parseJobHistory(experienceSection),
    technicalSkills,
    softSkills,
    toolsPlatforms: technicalSkills.filter((skill) => /aws|azure|docker|git|mysql|postgres|linux|jira/i.test(skill)),
    certifications: parseListSection(certificationSection),
    projects: projectsSection
      .split(/\n{2,}/)
      .map((block) => sanitizeText(block))
      .filter(Boolean)
      .slice(0, 6)
      .map((block) => ({ name: block.split(".")[0], description: block })),
    keywords: extractKeywords(normalizedText),
    contactLinks: extractContactLinks(normalizedText)
  };
}
