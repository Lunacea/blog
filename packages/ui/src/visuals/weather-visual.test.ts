import { assert, assertEquals } from "@std/assert";
import type { WeatherCondition, WeatherState } from "@lunacea/schemas";
import {
  applyPassingWeather,
  normalizeWeatherVisualCondition,
  parseWeatherVisualOverride,
} from "./weather-visual.ts";

function state(condition: WeatherCondition, source: WeatherState["source"] = "open-meteo") {
  return { condition, source };
}

Deno.test("weather conditions normalize to the shared visual vocabulary", () => {
  assertEquals(normalizeWeatherVisualCondition(state("clear")), "clear");
  assertEquals(normalizeWeatherVisualCondition(state("cloudy")), "cloudy");
  assertEquals(normalizeWeatherVisualCondition(state("fog")), "cloudy");
  assertEquals(normalizeWeatherVisualCondition(state("rain")), "rain");
  assertEquals(normalizeWeatherVisualCondition(state("storm")), "rain");
  assertEquals(normalizeWeatherVisualCondition(state("snow")), "snow");
  assertEquals(normalizeWeatherVisualCondition(state("unknown")), "neutral");
  assertEquals(normalizeWeatherVisualCondition(state("clear", "time-fallback")), "neutral");
});

Deno.test("development weather overrides accept only visual states", () => {
  for (const condition of ["clear", "cloudy", "rain", "snow", "neutral"] as const) {
    assertEquals(parseWeatherVisualOverride(condition), condition);
  }
  assertEquals(parseWeatherVisualOverride("storm"), null);
  assertEquals(parseWeatherVisualOverride(null), null);
});

Deno.test("reported rain and snow are never reinterpreted", () => {
  for (const condition of ["rain", "snow", "neutral"] as const) {
    for (let bucket = 0; bucket < 400; bucket++) {
      const at = new Date(Date.UTC(2026, 6, 1) + bucket * 20 * 60 * 1000);
      assertEquals(applyPassingWeather(condition, at).condition, condition);
      assertEquals(applyPassingWeather(condition, at).intensity, "steady");
    }
  }
});

/** 1か月分の20分バケットをすべて回し、対象の月だけを標本にする。 */
function overMonth<T>(month: number, read: (at: Date) => T): T[] {
  const out: T[] = [];
  const end = new Date(2026, month + 1, 1).getTime();
  for (let t = new Date(2026, month, 1).getTime(); t < end; t += 20 * 60 * 1000) {
    out.push(read(new Date(t)));
  }
  return out;
}

Deno.test("a shower is rarer over a clear sky than over cloud, and always passing", () => {
  const rate = (condition: "clear" | "cloudy", month: number) => {
    const visuals = overMonth(month, (at) => applyPassingWeather(condition, at));
    const showers = visuals.filter((v) => v.condition === "rain" || v.condition === "snow");
    for (const shower of showers) assertEquals(shower.intensity, "passing");
    return showers.length / visuals.length;
  };
  const overCloud = rate("cloudy", 6);
  const overClear = rate("clear", 6);
  assert(overClear < overCloud, `${overClear} should be rarer than ${overCloud}`);
  assert(overCloud > 0, "a wet month should produce some showers");
  assert(overCloud < 0.2, `a shower should stay an aside, got ${overCloud}`);
});

Deno.test("showers follow the month: wetter in summer, snow only in the cold months", () => {
  const showers = (month: number) =>
    overMonth(month, (at) => applyPassingWeather("cloudy", at).condition);
  assert(
    showers(6).filter((c) => c === "rain").length > showers(0).filter((c) => c === "rain").length,
    "July should out-rain January",
  );
  for (const month of [4, 5, 6, 7, 8, 9]) {
    assert(!showers(month).includes("snow"), `no snow in month ${month + 1}`);
  }
  assert(showers(0).includes("snow"), "January should still flurry");
});

Deno.test("the same bucket always gives the same sky", () => {
  const at = new Date(Date.UTC(2026, 7, 14, 9, 3));
  const first = applyPassingWeather("cloudy", at);
  const again = applyPassingWeather("cloudy", new Date(at.getTime() + 60_000));
  assertEquals(first, again);
});
