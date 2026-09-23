import { expect, it } from "vitest";
import { currentHeading, readingProgress } from "$lib/articles/reading-position.ts";

const rect = (top: number, height: number) => ({ top, height }) as DOMRect;

it("reads a short article as finished and clamps a long one between 0 and 100", () => {
  expect(readingProgress(rect(0, 600), 800)).toBe(100);
  expect(readingProgress(rect(100, 2800), 800)).toBe(0);
  expect(readingProgress(rect(-1000, 2800), 800)).toBe(50);
  expect(readingProgress(rect(-5000, 2800), 800)).toBe(100);
});

it("marks the last heading above the activation line, or the first when none has arrived", () => {
  const headings = [{ id: "a", top: 300 }, { id: "b", top: 900 }, { id: "c", top: 1500 }];
  expect(currentHeading(headings, 100)).toBe("a");
  expect(currentHeading(headings, 900)).toBe("b");
  expect(currentHeading(headings, 5000)).toBe("c");
  expect(currentHeading([], 100)).toBe("");
});
