import { describe, expect, it } from "vitest";
import { articleView, dayNumber, serendipityCount, serendipityPicks } from "$lib/article-view.ts";

describe("article display query", () => {
  it("defaults to the newspaper and keeps filtered URLs on it", () => {
    for (
      const query of [
        "",
        "view=grid",
        "view=unknown",
        "q= ",
        "q=Svelte",
        "tag=Deno&view=grid",
        "category=engineering",
        "sort=updated",
      ]
    ) expect(articleView(new URLSearchParams(query)), query).toBe("grid");
  });
  it("uses the list only where the URL asks for it", () => {
    for (
      const query of ["view=list", "q=Svelte&view=list", "category=engineering&view=list"]
    ) expect(articleView(new URLSearchParams(query)), query).toBe("list");
  });
});

describe("serendipity box", () => {
  const pool = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("keeps small archives whole and lets larger ones spare three records", () => {
    expect([0, 3, 4, 5, 6, 20].map(serendipityCount)).toEqual([0, 0, 2, 2, 3, 3]);
  });
  it("returns the same distinct picks for one day and different picks across days", () => {
    const today = serendipityPicks(pool, 3, 1000);
    expect(today).toHaveLength(3);
    expect(new Set(today).size).toBe(3);
    expect(serendipityPicks(pool, 3, 1000)).toEqual(today);
    expect(
      [1001, 1002, 1003, 1004].some((day) =>
        serendipityPicks(pool, 3, day).join() !== today.join()
      ),
    ).toBe(true);
  });
  it("never asks for more records than the pool holds", () => {
    expect(serendipityPicks(["a", "b"], 3, 7)).toHaveLength(2);
    expect(serendipityPicks([], 3, 7)).toEqual([]);
  });
  it("advances the day number at each UTC midnight", () => {
    expect(dayNumber(new Date("2026-09-05T23:59:59.000Z")) + 1).toBe(
      dayNumber(new Date("2026-09-06T00:00:00.000Z")),
    );
  });
});
