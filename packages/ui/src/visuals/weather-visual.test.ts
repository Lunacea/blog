import { assertEquals } from "@std/assert";
import type { WeatherCondition, WeatherState } from "@lunacea/schemas";
import { normalizeWeatherVisualCondition, parseWeatherVisualOverride } from "./weather-visual.ts";

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
