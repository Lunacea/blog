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

Deno.test("octahedron sampling stays on uniformly selected triangular faces", () => {
  const positions = createHeroShapePositions(2400).octahedron;
  const faces = new Array(8).fill(0);
  for (let index = 0; index < positions.length; index += 3) {
    const x = positions[index];
    const y = positions[index + 1];
    const z = positions[index + 2];
    const normalized = Math.abs(x) + Math.abs(y) + Math.abs(z);
    if (Math.abs(normalized - 1.45) > 0.0001) throw new Error("point left octahedron surface");
    const face = (x < 0 ? 1 : 0) + (y < 0 ? 2 : 0) + (z < 0 ? 4 : 0);
    faces[face] += 1;
  }
  assertEquals(faces, new Array(8).fill(300));
});
