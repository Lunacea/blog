<script lang="ts">
  import { onMount } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import {
    locationSchema,
    weatherStateSchema,
    type Location,
    type WeatherState
  } from "@lunacea/schemas";

  const initialLocation = locationSchema.parse(siteConfig.defaultLocation);

  function fallbackWeather(selected: Location): WeatherState {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: selected.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "00";
    const hour = Number(value("hour"));
    return weatherStateSchema.parse({
      location: selected,
      observedAt: `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`,
      temperatureC: null,
      condition: "unknown",
      phase: hour >= 6 && hour < 18 ? "day" : "night",
      source: "time-fallback"
    });
  }

  let location = $state<Location>(initialLocation);
  let weather = $state<WeatherState>(fallbackWeather(initialLocation));
  let query = $state("");
  let results = $state<Location[]>([]);
  let loading = $state(false);
  let message = $state("環境データを取得中");

  const conditionLabels = {
    clear: "晴れ",
    cloudy: "曇り",
    fog: "霧",
    rain: "雨",
    snow: "雪",
    storm: "雷雨",
    unknown: "時刻のみ"
  };

  function weatherUrl(selected: Location): string {
    const params = new URLSearchParams({
      id: selected.id,
      name: selected.name,
      region: selected.region ?? "",
      country: selected.country,
      lat: String(selected.latitude),
      lon: String(selected.longitude),
      timezone: selected.timezone
    });
    return "/api/v1/weather?" + params;
  }

  async function loadWeather() {
    loading = true;
    try {
      const response = await fetch(weatherUrl(location));
      weather = weatherStateSchema.parse(await response.json());
      document.documentElement.dataset.weather = weather.condition;
      document.documentElement.dataset.phase = weather.phase;
      message = weather.source === "time-fallback"
        ? "天候を取得できなかったため時刻のみ反映"
        : "天候を更新";
    } catch {
      weather = fallbackWeather(location);
      document.documentElement.dataset.weather = weather.condition;
      document.documentElement.dataset.phase = weather.phase;
      message = "環境データを取得できませんでした";
    } finally {
      loading = false;
    }
  }

  async function search() {
    if (query.trim().length < 2) return;
    loading = true;
    try {
      const response = await fetch("/api/v1/locations?q=" + encodeURIComponent(query));
      const data = await response.json();
      results = locationSchema.array().parse(data.locations);
      message = results.length ? "地点を選択してください" : "候補が見つかりません";
    } catch {
      message = "地点を検索できませんでした";
    } finally {
      loading = false;
    }
  }

  function selectLocation(selected: Location) {
    location = selected;
    weather = fallbackWeather(selected);
    localStorage.setItem("lunacea-location", JSON.stringify(selected));
    results = [];
    query = "";
    void loadWeather();
  }

  onMount(() => {
    const stored = localStorage.getItem("lunacea-location");
    if (stored) {
      const parsed = locationSchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        location = parsed.data;
        weather = fallbackWeather(parsed.data);
      }
    }
    void loadWeather();
  });
</script>

<section class="weather" aria-labelledby="weather-title">
  <div>
    <p class="eyebrow" id="weather-title">Environment / {location.name}</p>
    {#if weather}
      <p class="state">
        <span>{conditionLabels[weather.condition]}</span>
        {#if weather.temperatureC !== null}<strong>{Math.round(weather.temperatureC)}°C</strong>{/if}
        <time datetime={weather.observedAt}>{weather.observedAt.slice(11, 16)}</time>
      </p>
    {:else}
      <p class="state">— / —</p>
    {/if}
  </div>
  <details>
    <summary>地点を変更</summary>
    <form onsubmit={(event) => { event.preventDefault(); void search(); }}>
      <label for="location-query">都市名</label>
      <div class="search-row">
        <input id="location-query" bind:value={query} minlength="2" maxlength="80" />
        <button type="submit" disabled={loading}>検索</button>
      </div>
    </form>
    {#if results.length}
      <ul>
        {#each results as result}
          <li>
            <button type="button" onclick={() => selectLocation(result)}>
              {result.name}<small>{result.region ?? result.country}</small>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </details>
  <p class="sr-status" aria-live="polite">{message}</p>
</section>

<style>
  .weather {
    position: relative;
    z-index: 2;
    display: flex;
    width: min(100%, 34rem);
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-6);
    border-top: 1px solid var(--color-line);
    padding-top: var(--space-4);
  }

  .state {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin: 0;
    font-family: var(--font-mono);
  }

  .state strong {
    font-size: var(--text-h3);
    font-weight: 450;
  }

  .state time {
    color: var(--color-muted);
  }

  details {
    position: relative;
  }

  summary {
    min-height: var(--control-size);
    cursor: pointer;
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  details[open] {
    min-width: min(22rem, 82vw);
  }

  form,
  ul {
    padding: var(--space-4);
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    box-shadow: var(--shadow-overlay);
  }

  form label {
    display: block;
    margin-bottom: 0.4rem;
    font-size: var(--text-caption);
  }

  .search-row {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  input,
  button {
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-background);
  }

  ul {
    margin: 0;
    padding: var(--space-2);
    list-style: none;
  }

  ul button {
    display: flex;
    width: 100%;
    align-items: flex-start;
    justify-content: space-between;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  small {
    color: var(--color-muted);
  }

  .sr-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  @media (max-width: 38rem) {
    .weather {
      flex-direction: column;
    }
  }
</style>
