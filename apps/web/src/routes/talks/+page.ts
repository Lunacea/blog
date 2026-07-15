import { listContent } from "@lunacea/content";
export const prerender = true;
export function load() {
  return { entries: listContent("talk") };
}
