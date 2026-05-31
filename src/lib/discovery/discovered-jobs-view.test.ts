import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createDiscoveredJobRow,
  filterDiscoveredJobRows,
  getDiscoveredJobReviewState,
  sortDiscoveredJobRows,
  type DiscoveredJobRowInput
} from "@/lib/discovery/discovered-jobs-view";

function job(overrides: Partial<DiscoveredJobRowInput> = {}): DiscoveredJobRowInput {
  return {
    id: "job-1",
    title: "Senior Product Engineer",
    company: "Signal Labs",
    location: "Remote",
    sourceName: "RemoteOK",
    discoveredAt: new Date("2026-05-30T12:00:00Z"),
    needsReview: true,
    isRemoteFriendly: true,
    isTrinidadAndTobago: false,
    workMode: "REMOTE",
    discoverySource: {
      id: "source-remoteok",
      name: "RemoteOK"
    },
    matches: [{ matchPercent: 82, reviewedAt: null }],
    savedBy: [],
    hiddenBy: [],
    applications: [],
    ...overrides
  };
}

function row(
  id: string,
  options: {
    match: number;
    confidence: number;
    tier?: string;
    source?: string;
    sourceId?: string;
    discoveredAt?: string;
    needsReview?: boolean;
    saved?: boolean;
    applied?: boolean;
    remote?: boolean;
    trinidad?: boolean;
  }
) {
  return createDiscoveredJobRow(
    job({
      id,
      sourceName: options.source ?? "RemoteOK",
      discoveredAt: new Date(options.discoveredAt ?? "2026-05-30T12:00:00Z"),
      needsReview: options.needsReview ?? true,
      isRemoteFriendly: options.remote ?? true,
      isTrinidadAndTobago: options.trinidad ?? false,
      workMode: options.remote === false ? "ONSITE" : "REMOTE",
      discoverySource: {
        id: options.sourceId ?? `source-${options.source ?? "remoteok"}`,
        name: options.source ?? "RemoteOK"
      },
      matches: [{ matchPercent: options.match, reviewedAt: options.needsReview === false ? new Date("2026-05-31") : null }],
      savedBy: options.saved ? [{}] : [],
      applications: options.applied ? [{}] : []
    }),
    {
      confidence: {
        tier: options.tier ?? "Medium Confidence",
        overall: options.confidence,
        badges: []
      },
      nextStep: "Inspect this role before applying."
    }
  );
}

describe("discovered jobs view helpers", () => {
  test("derives review state from workflow signals", () => {
    assert.equal(getDiscoveredJobReviewState(job()), "Needs review");
    assert.equal(getDiscoveredJobReviewState(job({ savedBy: [{}] })), "Saved");
    assert.equal(getDiscoveredJobReviewState(job({ applications: [{}] })), "Applied");
    assert.equal(getDiscoveredJobReviewState(job({ hiddenBy: [{}] })), "Hidden");
    assert.equal(
      getDiscoveredJobReviewState(job({ needsReview: false, matches: [{ matchPercent: 75, reviewedAt: new Date() }] })),
      "Reviewed"
    );
  });

  test("sorts priority by review state, confidence, then match score", () => {
    const rows = [
      row("reviewed-high", { match: 99, confidence: 99, needsReview: false }),
      row("needs-review-medium", { match: 75, confidence: 70 }),
      row("needs-review-high", { match: 80, confidence: 92 })
    ];

    assert.deepEqual(sortDiscoveredJobRows(rows, "priority").map((item) => item.job.id), [
      "needs-review-high",
      "needs-review-medium",
      "reviewed-high"
    ]);
  });

  test("sorts by match, confidence, source, discovered date, and review state", () => {
    const rows = [
      row("a", { match: 65, confidence: 90, source: "Lever", discoveredAt: "2026-05-28T00:00:00Z" }),
      row("b", { match: 92, confidence: 60, source: "Ashby", discoveredAt: "2026-05-29T00:00:00Z" }),
      row("c", { match: 80, confidence: 96, source: "Greenhouse", discoveredAt: "2026-05-31T00:00:00Z", needsReview: false })
    ];

    assert.equal(sortDiscoveredJobRows(rows, "match")[0].job.id, "b");
    assert.equal(sortDiscoveredJobRows(rows, "confidence")[0].job.id, "c");
    assert.equal(sortDiscoveredJobRows(rows, "source")[0].job.id, "b");
    assert.equal(sortDiscoveredJobRows(rows, "discovered")[0].job.id, "c");
    assert.equal(sortDiscoveredJobRows(rows, "review")[0].job.id, "b");
  });

  test("filters by confidence, source, match, remote, Trinidad, and review state", () => {
    const rows = [
      row("remote-high", { match: 90, confidence: 92, tier: "High Confidence", sourceId: "remote", remote: true }),
      row("onsite-low", { match: 72, confidence: 45, tier: "Needs Review", sourceId: "local", remote: false }),
      row("trinidad-reviewed", { match: 86, confidence: 82, sourceId: "regional", trinidad: true, needsReview: false })
    ];

    assert.deepEqual(filterDiscoveredJobRows(rows, { confidence: "high" }).map((item) => item.job.id), ["remote-high"]);
    assert.deepEqual(filterDiscoveredJobRows(rows, { remoteOnly: true }).map((item) => item.job.id), ["remote-high", "trinidad-reviewed"]);
    assert.deepEqual(filterDiscoveredJobRows(rows, { trinidadOnly: true }).map((item) => item.job.id), ["trinidad-reviewed"]);
    assert.deepEqual(filterDiscoveredJobRows(rows, { highMatchOnly: true }).map((item) => item.job.id), ["remote-high", "trinidad-reviewed"]);
    assert.deepEqual(filterDiscoveredJobRows(rows, { needsReviewOnly: true }).map((item) => item.job.id), ["remote-high", "onsite-low"]);
    assert.deepEqual(filterDiscoveredJobRows(rows, { sourceId: "local" }).map((item) => item.job.id), ["onsite-low"]);
  });

  test("returns a stable empty result for impossible filter combinations", () => {
    const rows = [
      row("remote-high", { match: 90, confidence: 92, tier: "High Confidence", sourceId: "remote", remote: true }),
      row("onsite-low", { match: 72, confidence: 45, tier: "Needs Review", sourceId: "local", remote: false })
    ];

    assert.deepEqual(
      filterDiscoveredJobRows(rows, {
        confidence: "high",
        remoteOnly: true,
        sourceId: "local"
      }),
      []
    );
  });
});
