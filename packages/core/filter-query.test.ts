import { assertEquals } from "@std/assert";
import { parseFilterQuery, updateFilterQuery } from "./filter-query.ts";

Deno.test("filter query helpers accept known values and preserve unrelated query keys", () => {
  assertEquals(
    parseFilterQuery("?kind=photos&year=invalid", {
      kind: ["photos", "places"],
      year: ["2026"],
    }),
    { kind: "photos" },
  );
  assertEquals(
    updateFilterQuery("?ref=home&kind=photos", { kind: "places", tag: "Design" }),
    "?ref=home&kind=places&tag=Design",
  );
});
