import type { ApprovedIconName } from "./Icon.svelte";

export const interfaceIcons = {
  search: "solar:magnifer-linear",
  tag: "solar:tag-linear",
  grid: "solar:widget-4-linear",
  list: "solar:list-outline",
  reset: "solar:restart-linear",
  copy: "solar:copy-linear",
  copied: "solar:check-circle-linear",
  externalLink: "solar:link-round-linear",
  motion: "solar:bolt-linear",
} as const satisfies Record<string, ApprovedIconName>;

export const socialIcons = {
  github: "simple-icons:github",
  x: "simple-icons:x",
  email: "solar:letter-linear",
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
