import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DiscoverySourceType, SeniorityLevel, WorkMode } from "@prisma/client";

import { normalizeFetchedItem } from "@/lib/discovery/normalize";
import type { FetchedSourceItem } from "@/lib/discovery/types";

function buildItem(overrides: Partial<FetchedSourceItem> = {}): FetchedSourceItem {
  return {
    externalId: "role-1",
    sourceUrl: "https://jobs.example.com/roles/role-1",
    title: "Frontend Engineer",
    company: "Signal Labs",
    locationRaw: "Remote Worldwide",
    description: "Build polished React and TypeScript interfaces for a remote SaaS team.",
    rawPayload: {},
    ...overrides
  };
}

describe("normalizeFetchedItem", () => {
  test("detects remote roles from role text and location", () => {
    const normalized = normalizeFetchedItem(
      DiscoverySourceType.API,
      "Remote Source",
      buildItem({
        title: "Senior Remote Frontend Engineer",
        locationRaw: "Remote Worldwide",
        description: "This is a full-time remote role building AI product surfaces."
      })
    );

    assert.equal(normalized.remoteStatus, WorkMode.REMOTE);
    assert.equal(normalized.isRemoteFriendly, true);
    assert.equal(normalized.locationText, "Remote");
  });

  test("parses salary min, max, and USD currency", () => {
    const normalized = normalizeFetchedItem(
      DiscoverySourceType.API,
      "Salary Source",
      buildItem({
        salaryRaw: "$120k - $150k"
      })
    );

    assert.equal(normalized.salaryMin, 120000);
    assert.equal(normalized.salaryMax, 150000);
    assert.equal(normalized.currency, "USD");
  });

  test("parses EUR and GBP symbols without mojibake regressions", () => {
    const eur = normalizeFetchedItem(
      DiscoverySourceType.API,
      "European Source",
      buildItem({
        salaryRaw: "\u20ac90k - \u20ac110k"
      })
    );
    const gbp = normalizeFetchedItem(
      DiscoverySourceType.API,
      "UK Source",
      buildItem({
        salaryRaw: "\u00a345k - \u00a355k"
      })
    );

    assert.equal(eur.currency, "EUR");
    assert.equal(eur.salaryMin, 90000);
    assert.equal(eur.salaryMax, 110000);
    assert.equal(gbp.currency, "GBP");
    assert.equal(gbp.salaryMin, 45000);
    assert.equal(gbp.salaryMax, 55000);
  });

  test("builds stable source URL dedupe keys after removing tracking noise", () => {
    const first = normalizeFetchedItem(
      DiscoverySourceType.API,
      "Stable Source",
      buildItem({
        applicationUrl: undefined,
        sourceUrl: "https://Example.com/jobs/123/?utm_source=newsletter&ref=matchiq#details"
      })
    );
    const second = normalizeFetchedItem(
      DiscoverySourceType.API,
      "Stable Source",
      buildItem({
        applicationUrl: undefined,
        sourceUrl: "https://example.com/jobs/123/?ref=matchiq&utm_campaign=spring#apply"
      })
    );

    assert.equal(first.dedupeKey, second.dedupeKey);
    assert.equal(first.dedupeKey, "source:https://example.com/jobs/123/?ref=matchiq");
  });

  test("preserves source tags and adds location-derived tags while inferring seniority and employment type", () => {
    const normalized = normalizeFetchedItem(
      DiscoverySourceType.API,
      "Tagged Source",
      buildItem({
        title: "Senior Product Engineer",
        locationRaw: "Remote Worldwide",
        description: "Full-time role building React systems for AI teams.",
        tags: ["react", "senior", "full-time"]
      })
    );

    assert.equal(normalized.experienceLevel, SeniorityLevel.SENIOR);
    assert.equal(normalized.employmentType, "Full-time");
    assert.deepEqual(normalized.tags.sort(), ["caribbean", "full-time", "react", "remote-friendly", "senior"]);
  });
});
