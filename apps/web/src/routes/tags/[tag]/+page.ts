import { allContent, tags } from "@lunacea/content";
export const prerender = true;
export function entries() {
  return tags.map((tag) => ({ tag }));
}
export function load({ params }) {
  return {
    tag: params.tag,
    entries: allContent.filter((entry) => entry.tags.includes(params.tag)),
  };
}
