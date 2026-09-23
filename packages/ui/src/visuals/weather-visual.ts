import type { WeatherState } from "@lunacea/schemas";

export type WeatherVisualCondition = "clear" | "cloudy" | "rain" | "snow" | "neutral";
export type WeatherVisualIntensity = "passing" | "steady";
export type WeatherVisual = {
  condition: WeatherVisualCondition;
  intensity: WeatherVisualIntensity;
};

/**
 * 設定地点の時間別出現頻度（Open-Meteo アーカイブ、2026-08 までの5年）。
 * 月ごとに通り雨がどれだけありうるかを決める。
 */
const monthlyRain = [.063, .072, .141, .166, .213, .283, .316, .325, .229, .190, .208, .148];
const monthlySnow = [.179, .101, .073, .006, 0, 0, 0, 0, 0, 0, .015, .141];
const monthlyClear = [.231, .277, .291, .321, .289, .227, .221, .234, .275, .352, .383, .241];

/** 通り雨は予報ではなく挿話なので、実際の出現率を大きく下げる。 */
const showerOverCloud = .28;
const showerOverClear = .09;
const breakInCloud = .3;

/** 通り雨は1バケットで過ぎる。 */
const bucketMs = 20 * 60 * 1000;

/** 連続するバケットには雪崩効果のあるハッシュが要る。素の xorshift では相関が残る。 */
function roll(bucket: number): number {
  let x = (bucket + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

/**
 * 雨と雪は観測どおり。晴れと曇りはまれに転ぶ（曇りが晴れに割れる、通り雨が横切る）。
 * 実際に降水の多い月ほど頻度が上がる。
 */
export function applyPassingWeather(
  condition: WeatherVisualCondition,
  at: Date = new Date(),
): WeatherVisual {
  if (condition !== "clear" && condition !== "cloudy") {
    return { condition, intensity: "steady" };
  }
  const month = at.getMonth();
  const scale = condition === "cloudy" ? showerOverCloud : showerOverClear;
  const snow = monthlySnow[month] * scale;
  const rain = monthlyRain[month] * scale;
  const clear = condition === "cloudy" ? monthlyClear[month] * breakInCloud : 0;
  const value = roll(Math.floor(at.getTime() / bucketMs));
  if (value < snow) return { condition: "snow", intensity: "passing" };
  if (value < snow + rain) return { condition: "rain", intensity: "passing" };
  if (value < snow + rain + clear) return { condition: "clear", intensity: "steady" };
  return { condition, intensity: "steady" };
}

export function parseWeatherVisualIntensityOverride(
  value: string | null,
): WeatherVisualIntensity | null {
  return value === "passing" || value === "steady" ? value : null;
}

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
