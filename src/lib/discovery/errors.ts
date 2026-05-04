export type DiscoveryFetchStage = "list-page" | "detail-page" | "api" | "rss";

export type DiscoveryFetchMetadata = {
  stage: DiscoveryFetchStage;
  requestUrl: string;
  requestMethod: "GET";
  responseStatus?: number;
  parserKey?: string;
  fetchStrategy?: string;
  sourceName?: string;
};

export class DiscoveryFetchError extends Error {
  metadata: DiscoveryFetchMetadata;

  constructor(message: string, metadata: DiscoveryFetchMetadata, options?: { cause?: unknown }) {
    super(message, options ? { cause: options.cause } : undefined);
    this.name = "DiscoveryFetchError";
    this.metadata = metadata;
  }
}

export function isDiscoveryFetchError(error: unknown): error is DiscoveryFetchError {
  return error instanceof DiscoveryFetchError;
}
