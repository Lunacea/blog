<script lang="ts">
  import { onMount } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import * as Collapsible from "$ui/primitives/collapsible";
  import { Button, Input } from "$ui/primitives";
  import { Icon, interfaceIcons, weatherIconName } from "$ui/icons";
  import {
    locationSchema,
    weatherStateSchema,
    type Location,
    type WeatherState
  } from "@lunacea/schemas";
  import {
    applyDisplayPreferences,
    readMotionPreference,
    readThemePreference,
    setMotionPreference,
    setThemePreference,
    subscribeDisplayCapabilities,
    type MotionPreference,
    type ThemePreference
  } from "$ui/motion/preferences";

  let { compact = false }: { compact?: boolean } = $props();

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
  let theme = $state<ThemePreference>("auto");
  let motion = $state<MotionPreference>("reduced");

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

  function setTheme(value: ThemePreference) {
    theme = value;
    setThemePreference(value);
  }

  function setMotion(value: MotionPreference) {
    motion = value;
    setMotionPreference(value);
  }

  onMount(() => {
    theme = readThemePreference();
    motion = readMotionPreference();
    applyDisplayPreferences(theme, motion);
    const stored = localStorage.getItem("lunacea-location");
    if (stored) {
      const parsed = locationSchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        location = parsed.data;
        weather = fallbackWeather(parsed.data);
      }
    }
    void loadWeather();
    return subscribeDisplayCapabilities(() => applyDisplayPreferences(theme, motion));
  });
</script>

<section class:compact class="weather" aria-labelledby="weather-title">
  <div>
    <p class="eyebrow" id="weather-title">Environment / {location.name}</p>
    {#if weather}
      <p class="state">
        <Icon name={weatherIconName(weather.condition, weather.phase)} />
        <span>{conditionLabels[weather.condition]}</span>
        {#if weather.temperatureC !== null}<strong>{Math.round(weather.temperatureC)}°C</strong>{/if}
        <time datetime={weather.observedAt}>{weather.observedAt.slice(11, 16)}</time>
      </p>
    {:else}
      <p class="state">— / —</p>
    {/if}
  </div>
  <Collapsible.Root class="weather-picker">
    <Collapsible.Trigger class="weather-trigger">
      <Icon name={interfaceIcons.display} />環境・表示
    </Collapsible.Trigger>
    <Collapsible.Content class="weather-content">
      <form onsubmit={(event) => { event.preventDefault(); void search(); }}>
      <label for="location-query">都市名</label>
      <div class="search-row">
        <Input id="location-query" bind:value={query} minlength={2} maxlength={80} />
        <Button type="submit" disabled={loading}>
          <Icon name={interfaceIcons.search} dataIcon="inline-start" />検索
        </Button>
      </div>
      </form>
      {#if results.length}
        <ul>
          {#each results as result}
            <li>
              <Button variant="ghost" type="button" onclick={() => selectLocation(result)}>
                {result.name}<small>{result.region ?? result.country}</small>
              </Button>
            </li>
          {/each}
        </ul>
      {/if}
      <div class="display-controls">
        <label>Theme
          <select value={theme} onchange={(event) => setTheme(event.currentTarget.value as ThemePreference)}>
            <option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
        <label>Motion
          <select value={motion} onchange={(event) => setMotion(event.currentTarget.value as MotionPreference)}>
            <option value="full">Full</option><option value="reduced">Reduced</option><option value="off">Off</option>
          </select>
        </label>
      </div>
    </Collapsible.Content>
  </Collapsible.Root>
  <p class="sr-status" aria-live="polite">{message}</p>
</section>

<style>
  .weather {
    position: relative;
    z-index: var(--z-visual);
    display: flex;
    width: min(100%, 34rem);
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-6);
    border-top: 1px solid var(--color-line);
    padding-top: var(--space-4);
  }

  .weather.compact { width: auto; align-items: center; gap: var(--space-3); border: 0; padding: 0; }
  .weather.compact .eyebrow { display: none; }
  .weather.compact .state { gap: var(--space-2); font-size: var(--text-caption); }
  .weather.compact .state strong { font-size: var(--text-small); }
  .weather.compact .state time { display: none; }

  .state {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin: 0;
    font-family: var(--font-mono);
  }

  .state strong {
    font-size: var(--text-h3);
    font-weight: var(--weight-quiet);
  }

  .state time {
    color: var(--color-muted);
  }

  .state :global(svg) {
    flex: none;
    align-self: center;
    font-size: var(--text-h3);
  }

  :global(.weather-picker) {
    position: relative;
  }

  :global(.weather-trigger) {
    display: inline-flex;
    min-height: var(--control-size);
    align-items: center;
    gap: var(--space-2);
    border: 0;
    background: transparent;
    cursor: pointer;
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  :global(.weather-trigger svg) {
    font-size: var(--text-small);
  }

  :global(.weather-picker[data-state="open"]) {
    min-width: min(22rem, 82vw);
  }

  :global(.weather-content) {
    position: absolute;
    top: 100%;
    right: 0;
    width: min(22rem, 82vw);
  }

  form,
  ul {
    padding: var(--space-4);
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    box-shadow: var(--shadow-overlay);
  }

  .display-controls { display: grid; gap: var(--space-3); border: 1px solid var(--color-line); border-top: 0; padding: var(--space-4); background: var(--color-surface); box-shadow: var(--shadow-overlay); }
  .display-controls label { display: grid; grid-template-columns: 1fr 7rem; align-items: center; gap: var(--space-4); font-size: var(--text-small); }
  .display-controls select { min-height: var(--control-size); border: 1px solid var(--color-line); background: var(--color-background); color: var(--color-foreground); }

  @media (max-width: 52rem) {
    .weather.compact .state span, .weather.compact .state :global(svg) { display: none; }
    :global(.weather-trigger) { width: var(--control-size); overflow: hidden; white-space: nowrap; }
    :global(.weather-trigger svg) { flex: none; }
  }

  form label {
    display: block;
    margin-bottom: var(--space-2);
    font-size: var(--text-caption);
  }

  .search-row {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  ul {
    margin: 0;
    padding: var(--space-2);
    list-style: none;
  }

  ul :global(.button) {
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

  @media (max-width: 44rem) {
    .weather {
      flex-direction: column;
    }
  }
</style>
