import { assertEquals } from "@std/assert";
import { createHeroShapePositions } from "./hero-geometry.ts";

Deno.test("hero geometry keeps deterministic equal vertex counts", () => {
  const first = createHeroShapePositions(900);
  const second = createHeroShapePositions(900);
  assertEquals(first.mobius.length, 2700);
  assertEquals(first.sphere.length, first.mobius.length);
  assertEquals(first.octahedron.length, first.mobius.length);
  assertEquals(first.mobius, second.mobius);
});
