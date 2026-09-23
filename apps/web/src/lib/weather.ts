import { onMount } from "svelte";
import { type Writable, writable } from "svelte/store";
import { siteConfig } from "@lunacea/config";
import { weatherStateSchema } from "@lunacea/schemas";
import {
  applyPassingWeather,
  normalizeWeatherVisualCondition,
  type WeatherVisualCondition,
  type WeatherVisualIntensity,
} from "$ui/visuals/weather-visual.ts";

export type WeatherContextState = {
  visual: WeatherVisualCondition;
  intensity: WeatherVisualIntensity;
  loaded: boolean;
};

/**
 * 共通の静的背景が描く天候。ホームは自前の背景を持ち、一覧がここへ公開し、
 * 記事ルートは最後に読まれた値をそのまま引き継ぐ（自前のリクエストはしない）。
 */
export const ambientWeather = writable<WeatherVisualCondition>("neutral");
export const ambientIntensity = writable<WeatherVisualIntensity>("steady");

/**
 * 記事ページは事前描画されていて自前の問い合わせをしないため、読みをここに残しておく。
 * app.html の描画前スクリプトがこれを読み、古すぎる読みを捨てたうえで初回描画から地色を決める。
 */
function publishSky(visual: WeatherVisualCondition, intensity: WeatherVisualIntensity) {
  ambientWeather.set(visual);
  ambientIntensity.set(intensity);
  const root = document.documentElement;
  root.dataset.weather = visual;
  root.dataset.intensity = intensity;
  try {
    localStorage.setItem(
      "lunacea-weather",
      JSON.stringify({ v: visual, i: intensity, t: Date.now() }),
    );
  } catch { /* ストレージは任意。 */ }
}

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
    publishSky(condition, intensity);
  } catch {
    if (signal?.aborted) return;
    state.set({ visual: "neutral", intensity: "steady", loaded: true });
  }
}
