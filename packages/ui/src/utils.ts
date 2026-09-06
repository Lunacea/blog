import type { ClassValue as SvelteClassValue } from "svelte/elements";

export type ClassValue = SvelteClassValue | false | null | undefined;

function flattenClass(value: ClassValue): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenClass(entry));
  return Object.entries(value).filter(([, enabled]) => Boolean(enabled)).map(([name]) => name);
}

export function cn(...values: ClassValue[]): string {
  return values.flatMap((value) => flattenClass(value)).join(" ");
}
