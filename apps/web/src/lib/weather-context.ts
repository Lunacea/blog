import { getContext, setContext } from "svelte";
import { type Writable, writable } from "svelte/store";
import { siteConfig } from "@lunacea/config";
import { weatherStateSchema } from "@lunacea/schemas";
import {
  normalizeWeatherVisualCondition,
  type WeatherVisualCondition,
} from "$ui/visuals/weather-visual.ts";

export type WeatherContextState = {
  visual: WeatherVisualCondition;
  loaded: boolean;
};

const WEATHER_CONTEXT = Symbol("lunacea-weather");

/**
 * The condition the shared static field renders. Home drives its own animated field; the catalog
 * publishes here so the shell is lit, and reading routes simply inherit whatever was last read
 * without making a request of their own.
 */
export const ambientWeather = writable<WeatherVisualCondition>("neutral");

function weatherUrl(): string {
  const location = siteConfig.defaultLocation;
  return "/api/v1/weather?" + new URLSearchParams({
    id: location.id,
    name: location.name,
    region: location.region,
    country: location.country,
    lat: String(location.latitude),
    lon: String(location.longitude),
    timezone: location.timezone,
  });
}

export function createWeatherContext(): Writable<WeatherContextState> {
  const state = writable<WeatherContextState>({ visual: "neutral", loaded: false });
  setContext(WEATHER_CONTEXT, state);
  return state;
}

export function getWeatherContext(): Writable<WeatherContextState> {
  return getContext<Writable<WeatherContextState>>(WEATHER_CONTEXT);
}

export async function loadFixedLocationWeather(
  state: Writable<WeatherContextState>,
  signal?: AbortSignal,
) {
  try {
    const response = await fetch(weatherUrl(), { signal });
    if (!response.ok) throw new Error("weather request failed");
    const weather = weatherStateSchema.parse(await response.json());
    const visual = normalizeWeatherVisualCondition(weather);
    state.set({ visual, loaded: true });
    ambientWeather.set(visual);
  } catch {
    if (signal?.aborted) return;
    state.set({ visual: "neutral", loaded: true });
  }
}
