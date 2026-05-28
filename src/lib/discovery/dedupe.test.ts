import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { calculateDescriptionSimilarity } from "@/lib/discovery/dedupe";

describe("calculateDescriptionSimilarity", () => {
  test("scores similar descriptions high", () => {
    const score = calculateDescriptionSimilarity(
      "Build React TypeScript SaaS interfaces for remote product teams with AI features.",
      "Build React and TypeScript SaaS interfaces for remote product teams with AI features."
    );

    assert.ok(score > 0.8, `Expected high similarity, received ${score}`);
  });

  test("scores unrelated descriptions low", () => {
    const score = calculateDescriptionSimilarity(
      "Build React TypeScript SaaS interfaces for remote product teams with AI features.",
      "Operate warehouse equipment, maintain inventory logs, and coordinate local shipping schedules."
    );

    assert.ok(score < 0.2, `Expected low similarity, received ${score}`);
  });
});
