import { expect, it } from "vitest";
import { sunlight, sunPosition } from "$lib/visuals/sunlight.ts";

const morioka = { latitude: 39.7036, longitude: 141.1527 };
const at = (iso: string) => sunlight(new Date(iso), morioka.latitude, morioka.longitude);

it("the midsummer noon sun stands high with no dusk and no night", () => {
  const { elevation } = sunPosition(
    new Date("2026-06-21T11:40:00+09:00"),
    morioka.latitude,
    morioka.longitude,
  );
  expect(elevation).toBeGreaterThan(70);
  expect(elevation).toBeLessThan(76);
  const noon = at("2026-06-21T11:40:00+09:00");
  expect(noon.dusk).toBe(0);
  expect(noon.night).toBe(0);
  expect(noon.low).toBeLessThan(0.05);
});

it("evening light is low, warm and comes from the west", () => {
  const evening = at("2026-06-21T18:50:00+09:00");
  expect(evening.dusk).toBeGreaterThan(0.5);
  expect(evening.low).toBeGreaterThan(0.9);
  expect(evening.side).toBeGreaterThan(0.5);
});

it("morning light comes from the east", () => {
  const morning = at("2026-06-21T04:40:00+09:00");
  expect(morning.dusk).toBeGreaterThan(0.5);
  expect(morning.side).toBeLessThan(-0.5);
});

it("midnight is fully night and carries no direction", () => {
  const midnight = at("2026-12-21T00:00:00+09:00");
  expect(midnight.night).toBe(1);
  expect(midnight.dusk).toBe(0);
  expect(midnight.side).toBeCloseTo(0);
});
