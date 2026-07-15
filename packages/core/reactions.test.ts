import { assertEquals } from "@std/assert";
import { emptyReactionSummary, toggleReaction } from "./reactions.ts";

Deno.test("reaction toggle is idempotent and never produces negative counts", () => {
  const initial = emptyReactionSummary("article:test");
  const active = toggleReaction(initial, "useful", true);
  assertEquals(active.counts.useful, 1);
  assertEquals(active.selected, ["useful"]);
  assertEquals(toggleReaction(active, "useful", true), active);

  const inactive = toggleReaction(active, "useful", false);
  assertEquals(inactive.counts.useful, 0);
  assertEquals(inactive.selected, []);
  assertEquals(toggleReaction(inactive, "useful", false).counts.useful, 0);
});
