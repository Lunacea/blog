import { assertEquals } from "@std/assert";
import { dayPhaseFromTime, weatherConditionFromCode } from "./weather.ts";

Deno.test("Open-Meteo codes map to deterministic interface conditions", () => {
  assertEquals(weatherConditionFromCode(0), "clear");
  assertEquals(weatherConditionFromCode(48), "fog");
  assertEquals(weatherConditionFromCode(63), "rain");
  assertEquals(weatherConditionFromCode(75), "snow");
  assertEquals(weatherConditionFromCode(96), "storm");
  assertEquals(weatherConditionFromCode(-1), "unknown");
});

Deno.test("day phase respects local sunrise and sunset", () => {
  assertEquals(dayPhaseFromTime("2026-06-01T12:00", "2026-06-01T04:10", "2026-06-01T18:55"), "day");
  assertEquals(
    dayPhaseFromTime("2026-06-01T22:00", "2026-06-01T04:10", "2026-06-01T18:55"),
    "night",
  );
  assertEquals(dayPhaseFromTime("2026-06-01T07:00"), "day");
});
