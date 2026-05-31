import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { navGroups } from "@/components/layout/app-shell";
import { commandItems } from "@/components/layout/command-palette";

const discoveredJobsHref = "/discovered-jobs";

describe("authenticated navigation", () => {
  test("includes the discovered jobs route in the sidebar navigation", () => {
    const navItem = navGroups
      .map((group) => group.items.find((item) => item.href === discoveredJobsHref))
      .find((item) => item);

    assert.ok(navItem);
    assert.equal(navItem.label, "Discovered Jobs");
    assert.equal(navItem.hint, "Source results");
  });

  test("includes the discovered jobs route in the command palette", () => {
    const commandItem = commandItems.find((item) => item.href === discoveredJobsHref);

    assert.ok(commandItem);
    assert.equal(commandItem.label, "Discovered Jobs");
    assert.match(commandItem.description, /source results/i);
  });
});
