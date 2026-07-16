import type { WeatherCondition, WeatherState } from "@lunacea/schemas";
import type { ApprovedIconName } from "./Icon.svelte";

export const interfaceIcons = {
  search: "solar:magnifer-linear",
  tag: "solar:tag-linear",
  location: "solar:map-point-linear",
  display: "solar:monitor-linear",
  theme: "solar:palette-linear",
  motion: "solar:bolt-linear",
} as const satisfies Record<string, ApprovedIconName>;

const tagIcons: Record<string, ApprovedIconName> = {
  accessibility: "solar:accessibility-linear",
  api: "solar:code-linear",
  content: "solar:document-text-linear",
  deno: "simple-icons:deno",
  "deno kv": "simple-icons:deno",
  design: "solar:palette-linear",
  hono: "solar:code-linear",
  motion: "solar:bolt-linear",
  search: "solar:magnifer-linear",
  svelte: "simple-icons:svelte",
  sveltekit: "simple-icons:svelte",
  threlte: "solar:code-linear",
  "three.js": "simple-icons:threedotjs",
  typescript: "simple-icons:typescript",
  weather: "solar:cloud-sun-2-linear",
  webgl: "simple-icons:webgl",
};

function normalizedTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+v?\d+(?:\.\d+)*$/u, "");
}

export function tagIconName(tag: string): ApprovedIconName {
  return tagIcons[normalizedTag(tag)] ?? interfaceIcons.tag;
}

export function weatherIconName(
  condition: WeatherCondition,
  phase: WeatherState["phase"],
): ApprovedIconName {
  if (condition === "clear") {
    return phase === "night" ? "solar:moon-linear" : "solar:sun-2-linear";
  }
  if (condition === "cloudy") {
    return phase === "night" ? "solar:cloudy-moon-linear" : "solar:cloud-sun-2-linear";
  }
  if (condition === "fog") return "solar:fog-linear";
  if (condition === "rain") return "solar:cloud-rain-linear";
  if (condition === "snow") return "solar:cloud-snowfall-linear";
  if (condition === "storm") return "solar:cloud-storm-linear";
  return "solar:clock-circle-linear";
}
