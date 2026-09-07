import { assertEquals } from "@std/assert";
import { stableFeedPath } from "./feed.ts";

Deno.test("migrated feed identity retains the legacy Talk path", () => {
  assertEquals(
    stableFeedPath("/articles/quiet-interfaces", ["/talks/quiet-interfaces"]),
    "/talks/quiet-interfaces",
  );
  assertEquals(stableFeedPath("/articles/new-entry", []), "/articles/new-entry");
});
