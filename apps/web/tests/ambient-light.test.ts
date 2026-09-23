import { expect, it } from "vitest";
import { createAmbientPulses, envelope, moods, pickPulse } from "$lib/visuals/ambient-pulses.ts";
import { createLightPath } from "$lib/visuals/light-path.ts";
import { createDaylight } from "$lib/visuals/sunlight.ts";

it("weights every weather's events to one and picks by the roll", () => {
  for (const choices of Object.values(moods)) {
    expect(choices.reduce((sum, [, weight]) => sum + weight, 0)).toBeCloseTo(1);
  }
  expect(pickPulse("rain", 0.1)).toBe("ripple");
  expect(pickPulse("rain", 0.9)).toBe("veil");
  expect(pickPulse("snow", 0.1)).toBe("gust");
});

it("starts and ends every event at zero strength", () => {
  expect(envelope(0)).toBe(0);
  expect(envelope(1)).toBeCloseTo(0);
  expect(envelope(0.5)).toBeCloseTo(1);
});

it("waits while someone is guiding the light and runs one event at a time", () => {
  const pulses = createAmbientPulses({ random: () => 0.5, forced: "bloom" });
  pulses.reset(0);
  expect(pulses.update(10_000, false).bloom).toBe(0);
  pulses.update(10_000, true);
  expect(pulses.update(12_000, true).bloom).toBeGreaterThan(0);
  // 始まった出来事は、途中で操作が始まっても最後まで流す。
  expect(pulses.update(13_000, false).bloom).toBeGreaterThan(0);
});

it("lets a fine pointer hold the light and releases it to drift later", () => {
  const path = createLightPath({ finePointer: true });
  path.pointer(0.1, 0.2, 0);
  expect(path.update(1, 1000, 0.016)).toEqual([0.1, 0.2]);
  expect(path.idle(1000)).toBe(false);
  expect(path.update(1, 20_000, 0.016)).not.toEqual([0.1, 0.2]);
  expect(path.idle(20_000)).toBe(true);
});

it("places the daylight at once and then eases towards a new reading", () => {
  let time = new Date("2026-06-21T11:40:00+09:00");
  const daylight = createDaylight(39.7, 141.15, () => time);
  expect(daylight.update(0, 0.016).night).toBe(0);
  time = new Date("2026-06-21T23:40:00+09:00");
  const soon = daylight.update(61_000, 0.016).night;
  expect(soon).toBeGreaterThan(0);
  expect(soon).toBeLessThan(0.1);
});
