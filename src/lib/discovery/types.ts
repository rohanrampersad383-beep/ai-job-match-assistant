import { type DiscoverySourceType, type FetchLogLevel, type Prisma, type SeniorityLevel, type WorkMode } from "@prisma/client";

export type DiscoverySourceRecord = Prisma.DiscoverySourceGetPayload<{
  include: {
    settings: true;
  };
}>;

export type FetchedSourceItem = {
  externalId?: string;
  sourceUrl: string;
  applicationUrl?: string;
  title: string;
  company: string;
  locationRaw: string;
  description: string;
  rawPayload: Prisma.InputJsonValue;
  rawText?: string;
  salaryRaw?: string;
  requirements?: string;
  employmentType?: string;
  experienceLevel?: SeniorityLevel;
  workMode?: WorkMode;
  postedAt?: Date | null;
  tags?: string[];
};

export type NormalizedLocationResult = {
  slug: string;
  rawValue: string;
  normalizedValue: string;
  country?: string;
  region?: string;
  city?: string;
  scope: "TRINIDAD_TOBAGO" | "CARIBBEAN" | "GLOBAL" | "REMOTE";
  isRemoteFriendly: boolean;
  isTrinidadAndTobago: boolean;
  isCaribbean: boolean;
  aliases: string[];
};

export type NormalizedDiscoveredJob = {
  sourceType: DiscoverySourceType;
  sourceName: string;
  sourceUrl: string;
  applicationUrl?: string;
  externalId?: string;
  title: string;
  company: string;
  locationRaw: string;
  locationText: string;
  country?: string;
  cityRegion?: string;
  remoteStatus?: WorkMode;
  isRemoteFriendly: boolean;
  isTrinidadAndTobago: boolean;
  isCaribbeanFriendly: boolean;
  salaryRaw?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description: string;
  requirements?: string;
  employmentType?: string;
  experienceLevel?: SeniorityLevel;
  postedAt?: Date | null;
  discoveredAt: Date;
  dedupeKey: string;
  normalizedHash: string;
  similarityScore?: number;
  tags: string[];
  location: NormalizedLocationResult;
};

export type SourceExecutionSummary = {
  jobsFound: number;
  jobsImported: number;
  duplicatesSkipped: number;
  parsingFailures: number;
  runtimeErrors: number;
  canonicalJobIds: string[];
};

export type DiscoveryFetchObserver = {
  onLog?: (entry: {
    level: FetchLogLevel;
    message: string;
    context?: Prisma.InputJsonValue;
  }) => Promise<void> | void;
};

export type DiscoverySourceAdapter = {
  type: DiscoverySourceType;
  canHandle: (source: DiscoverySourceRecord) => boolean;
  fetchItems: (source: DiscoverySourceRecord, observer?: DiscoveryFetchObserver) => Promise<FetchedSourceItem[]>;
};
