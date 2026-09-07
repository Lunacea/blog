import { assertEquals } from "@std/assert";
import { emptyReactionSummary, toggleReaction } from "./reactions.ts";

Deno.test("reaction toggle is idempotent and never produces negative counts", () => {
  const initial = emptyReactionSummary("article:test");
  const active = toggleReaction(initial, true);
  assertEquals(active.count, 1);
  assertEquals(active.selected, true);
  assertEquals(toggleReaction(active, true), active);

  const inactive = toggleReaction(active, false);
  assertEquals(inactive.count, 0);
  assertEquals(inactive.selected, false);
  assertEquals(toggleReaction(inactive, false).count, 0);
});
