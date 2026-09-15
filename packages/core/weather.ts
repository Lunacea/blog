import type { DayPhase, WeatherCondition } from "./weather_types.ts";

export type { DayPhase, WeatherCondition } from "./weather_types.ts";

export function weatherConditionFromCode(code: number): WeatherCondition {
  // 0 は快晴、1 はおおむね晴れ。どちらも clear として扱う。
  if (code === 0 || code === 1) return "clear";
  if ([2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "storm";
  return "unknown";
}

export function dayPhaseFromTime(isoTime: string, sunrise?: string, sunset?: string): DayPhase {
  if (sunrise && sunset) {
    return isoTime >= sunrise && isoTime < sunset ? "day" : "night";
  }
  const hour = Number(isoTime.slice(11, 13));
  return hour >= 6 && hour < 18 ? "day" : "night";
}
