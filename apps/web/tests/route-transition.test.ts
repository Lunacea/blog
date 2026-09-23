import { expect, it } from "vitest";
import { foldFrames } from "$lib/navigation/paper-fold.ts";
import { isCatalogViewChange, planRouteTransition } from "$lib/navigation/route-transition.ts";

const url = (path: string) => new URL(path, "https://example.test");

it("hands the paper up from a listing and folds it back into the listing", () => {
  expect(planRouteTransition(url("/articles"), url("/articles/button-feel"))).toEqual({
    kind: "page",
    paper: "rise",
  });
  expect(planRouteTransition(url("/articles/button-feel"), url("/"))).toEqual({
    kind: "page",
    paper: "fold",
    header: "leave",
  });
  expect(planRouteTransition(url("/"), url("/articles"))).toEqual({
    kind: "page",
    header: "enter",
  });
});

it("keeps in-page moves and filter changes out of page transitions", () => {
  expect(planRouteTransition(url("/articles#a"), url("/articles#b"))).toBeUndefined();
  expect(planRouteTransition(url("/articles"), url("/articles?category=design")))
    .toBeUndefined();
  expect(planRouteTransition(url("/articles?q=a"), url("/articles?q=a&view=list"))).toEqual({
    kind: "catalog",
  });
  expect(isCatalogViewChange(url("/articles?view=list&q=a"), url("/articles?q=b"))).toBe(false);
});

it("starts the fold from the part of the paper that was on screen", () => {
  const paper = { left: 0, top: -600, width: 1000, height: 3000, bottom: 2400 };
  const row = { left: 100, top: 200, width: 800, height: 120, bottom: 320 };
  const frames = foldFrames(paper, row, 900);
  expect(frames.group.from).toEqual({
    transform: "translate(0px, 0px)",
    width: "1000px",
    height: "900px",
  });
  expect(frames.group.to.height).toBe("120px");
  // 見えていた部分は紙面の上端から 600px 下。行の幅まで縮むと像も 0.8 倍になる。
  expect(frames.image).toEqual({ from: { top: "-600px" }, to: { top: "-480px" } });
});
