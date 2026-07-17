import { listContent } from "@lunacea/content";
export const prerender = true;
export function load() {
  const entries = listContent("work");
  return {
    entries,
    years: [...new Set(entries.map((entry) => entry.publishedAt.slice(0, 4)))],
    stacks: [...new Set(entries.flatMap((entry) => entry.stack))].sort(),
    fields: [...new Set(entries.flatMap((entry) => entry.fields))].sort(),
  };
}
