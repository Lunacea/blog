import { onMount } from "svelte";
import { type Writable, writable } from "svelte/store";
import { siteConfig } from "@lunacea/config";
import { weatherStateSchema } from "@lunacea/schemas";
import {
  applyPassingWeather,
  normalizeWeatherVisualCondition,
  type WeatherVisualCondition,
  type WeatherVisualIntensity,
} from "$lib/visuals/weather-visual.ts";

export type WeatherContextState = {
  visual: WeatherVisualCondition;
  intensity: WeatherVisualIntensity;
  loaded: boolean;
};

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

/** 状態と中断はルート側に置き、通信も Svelte コンテキストも UI パッケージに入れない。 */
export function useFixedLocationWeather(): Writable<WeatherContextState> {
  const state = writable<WeatherContextState>({
    visual: "neutral",
    intensity: "steady",
    loaded: false,
  });
  onMount(() => {
    const controller = new AbortController();
    void loadFixedLocationWeather(state, controller.signal);
    return () => controller.abort();
  });
  return state;
}

export async function loadFixedLocationWeather(
  state: Writable<WeatherContextState>,
  signal?: AbortSignal,
) {
  try {
    const response = await fetch(weatherUrl(), { signal });
    if (!response.ok) throw new Error("weather request failed");
    const weather = weatherStateSchema.parse(await response.json());
    const { condition, intensity } = applyPassingWeather(normalizeWeatherVisualCondition(weather));
    state.set({ visual: condition, intensity, loaded: true });
  } catch {
    if (signal?.aborted) return;
    state.set({ visual: "neutral", intensity: "steady", loaded: true });
  }
}
