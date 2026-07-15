import { error } from "@sveltejs/kit";
import { listContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";

const kinds: Record<string, ContentType> = {
  photos: "photo",
  places: "place",
  wines: "wine",
  moments: "moment",
};
export const prerender = true;
export function entries() {
  return Object.keys(kinds).map((kind) => ({ kind }));
}
export function load({ params }) {
  const type = kinds[params.kind];
  if (!type) error(404, "Archive kind not found");
  return { kind: params.kind, type, entries: listContent(type) };
}
