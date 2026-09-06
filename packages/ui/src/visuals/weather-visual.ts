import type { WeatherState } from "@lunacea/schemas";

export type WeatherVisualCondition = "clear" | "cloudy" | "rain" | "snow" | "neutral";

export function parseWeatherVisualOverride(value: string | null): WeatherVisualCondition | null {
  switch (value) {
    case "clear":
    case "cloudy":
    case "rain":
    case "snow":
    case "neutral":
      return value;
    default:
      return null;
  }
}

export function normalizeWeatherVisualCondition(
  weather: Pick<WeatherState, "condition" | "source">,
): WeatherVisualCondition {
  if (weather.source === "time-fallback") return "neutral";
  switch (weather.condition) {
    case "clear":
    case "cloudy":
    case "rain":
    case "snow":
      return weather.condition;
    case "fog":
      return "cloudy";
    case "storm":
      return "rain";
    default:
      return "neutral";
  }
}
