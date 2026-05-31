import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { explainJobMatch } from "@/lib/intelligence/career";

describe("explainJobMatch", () => {
  test("surfaces scoring reasons for sparse profiles and hard blockers", () => {
    const explanation = explainJobMatch({
      title: "Frontend Engineer",
      company: "Example Co",
      location: "Berlin, Germany - onsite only",
      workMode: "ONSITE",
      salaryMin: null,
      salaryMax: null,
      description: "Onsite only. Must already be authorized to work in Germany.",
      requiredSkills: ["React", "TypeScript"],
      preferredSkills: ["GraphQL"],
      isRemoteFriendly: false,
      isTrinidadAndTobago: false,
      isCaribbeanFriendlyRemote: false,
      seniorityLevel: "MID",
      matches: [
        {
          matchPercent: 48,
          matchedSkills: ["React", "TypeScript"],
          missingSkills: ["GraphQL"],
          reasons: [
            { label: "Profile confidence is low because MatchIQ has limited skills, resume, or project evidence for this user.", tone: "neutral" },
            { label: "Location is outside your preferred regions.", tone: "warning" },
            { label: "Work mode conflicts with your preference.", tone: "warning" }
          ]
        }
      ]
    });

    assert.ok(explanation.watchouts.some((watchout) => /profile confidence/i.test(watchout)));
    assert.ok(explanation.watchouts.some((watchout) => /location|work mode/i.test(watchout)));
  });
});
