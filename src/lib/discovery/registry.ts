import { apiDiscoveryAdapter } from "@/lib/discovery/sources/api";
import { htmlDiscoveryAdapter } from "@/lib/discovery/sources/html";
import { rssDiscoveryAdapter } from "@/lib/discovery/sources/rss";
import type { DiscoverySourceAdapter, DiscoverySourceRecord } from "@/lib/discovery/types";

const adapters: DiscoverySourceAdapter[] = [rssDiscoveryAdapter, apiDiscoveryAdapter, htmlDiscoveryAdapter];

export function resolveDiscoveryAdapter(source: DiscoverySourceRecord) {
  const adapter = adapters.find((candidate) => candidate.canHandle(source));

  if (!adapter) {
    throw new Error(`No discovery adapter is registered for source ${source.name}.`);
  }

  return adapter;
}
