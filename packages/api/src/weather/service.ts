import { dayPhaseFromTime, weatherConditionFromCode } from "@lunacea/core/weather.ts";
import { siteConfig } from "@lunacea/config";
import {
  type Location,
  locationSchema,
  type WeatherState,
  weatherStateSchema,
} from "@lunacea/schemas";

type CacheEntry = { expiresAt: number; value: unknown };
const cache = new Map<string, CacheEntry>();

async function cachedJson(url: URL, ttl: number, fetcher: typeof fetch): Promise<unknown> {
  const key = url.toString();
  const current = cache.get(key);
  if (current && current.expiresAt > Date.now()) return current.value;
  const response = await fetcher(url, {
    headers: { "user-agent": "Lunacea-Archive/1.0 (+https://blog.lunacea.jp)" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Weather upstream responded with ${response.status}`);
  const value = await response.json();
  cache.set(key, { expiresAt: Date.now() + ttl, value });
  return value;
}

function localIso(timezone: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date());
  return parts.replace(" ", "T");
}

export async function findLocations(
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<Location[]> {
  if (query.trim().length < 2) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query.trim(),
    count: "8",
    language: "ja",
    format: "json",
  }).toString();
  const data = await cachedJson(url, 24 * 60 * 60_000, fetcher) as {
    results?: Array<Record<string, unknown>>;
  };
  return (data.results ?? []).flatMap((result) => {
    const parsed = locationSchema.safeParse({
      id: String(result.id),
      name: result.name,
      region: result.admin1,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export async function getWeather(
  location: Location,
  fetcher: typeof fetch = fetch,
): Promise<WeatherState> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,weather_code,is_day",
    daily: "sunrise,sunset",
    forecast_days: "1",
    timezone: location.timezone,
  }).toString();
  try {
    const data = await cachedJson(url, 20 * 60_000, fetcher) as {
      current?: { time?: string; temperature_2m?: number; weather_code?: number; is_day?: number };
      daily?: { sunrise?: string[]; sunset?: string[] };
    };
    const time = data.current?.time ?? localIso(location.timezone);
    return weatherStateSchema.parse({
      location,
      observedAt: time,
      temperatureC: data.current?.temperature_2m ?? null,
      condition: weatherConditionFromCode(data.current?.weather_code ?? -1),
      phase: data.current?.is_day === 1
        ? "day"
        : data.current?.is_day === 0
        ? "night"
        : dayPhaseFromTime(time, data.daily?.sunrise?.[0], data.daily?.sunset?.[0]),
      source: "open-meteo",
    });
  } catch {
    const time = localIso(location.timezone);
    return {
      location,
      observedAt: time,
      temperatureC: null,
      condition: "unknown",
      phase: dayPhaseFromTime(time),
      source: "time-fallback",
    };
  }
}

export const defaultLocation: Location = locationSchema.parse(siteConfig.defaultLocation);
