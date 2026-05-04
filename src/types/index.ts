import {
  ApplyRecommendation,
  ApplicationStatus,
  DocumentType,
  InterviewStatus,
  MatchCategory,
  SeniorityLevel,
  WorkMode
} from "@prisma/client";

export type ResumeEducationItem = {
  school?: string;
  degree?: string;
  details?: string;
};

export type ResumeJobHistoryItem = {
  heading?: string;
  company?: string;
  period?: string;
  summary?: string;
};

export type ResumeProjectItem = {
  name?: string;
  description?: string;
};

export type ParsedResume = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  yearsExperience: number;
  education: ResumeEducationItem[];
  jobHistory: ResumeJobHistoryItem[];
  technicalSkills: string[];
  softSkills: string[];
  toolsPlatforms: string[];
  certifications: string[];
  projects: ResumeProjectItem[];
  keywords: string[];
  contactLinks: { label: string; url: string }[];
};

export type ScoreReason = {
  label: string;
  tone: "positive" | "neutral" | "warning";
};

export type ScoreResult = {
  totalScore: number;
  matchPercent: number;
  category: MatchCategory;
  applyWorthIt: ApplyRecommendation;
  reasons: ScoreReason[];
  matchedSkills: string[];
  missingSkills: string[];
  penalties: string[];
};

export type DashboardFilters = {
  query?: string;
  workMode?: WorkMode | "ALL";
  seniority?: SeniorityLevel | "ALL";
  minMatch?: number;
  sourceId?: string;
  recentDays?: number;
  discoveredOnly?: boolean;
  trinidadOnly?: boolean;
  remoteFriendlyOnly?: boolean;
  view?: "all" | "saved" | "hidden" | "applied" | "reviewed" | "needs-review" | "high-match";
  page?: number;
};

export type ApplicationDraftBundle = {
  [DocumentType.COVER_LETTER]: string;
  [DocumentType.PROFESSIONAL_SUMMARY]: string;
  [DocumentType.RESUME_BULLET_SUGGESTIONS]: string;
  [DocumentType.APPLICATION_ANSWERS]: string;
};

export type ApplicationTrackerItem = {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  interviewStatus: InterviewStatus;
  appliedAt: Date | null;
  followUpDate: Date | null;
  notes: string | null;
};
