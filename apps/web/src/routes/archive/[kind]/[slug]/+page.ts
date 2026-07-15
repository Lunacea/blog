import { error } from "@sveltejs/kit";
import { allContent, findContent, listContent, loadContentModule } from "@lunacea/content";
import { relatedContent } from "@lunacea/core/related.ts";
import type { ContentType } from "@lunacea/schemas";

const kinds: Record<string, ContentType> = {
  photos: "photo",
  places: "place",
  wines: "wine",
  moments: "moment",
};
export const prerender = true;
export function entries() {
  return Object.entries(kinds).flatMap(([kind, type]) =>
    listContent(type).map(({ slug }) => ({ kind, slug }))
  );
}
export async function load({ params }) {
  const type = kinds[params.kind];
  if (!type) error(404, "Archive kind not found");
  const metadata = findContent(type, params.slug);
  if (!metadata) error(404, "Archive record not found");
  const module = await loadContentModule(type, params.slug);
  return { metadata, component: module.default, related: relatedContent(metadata, allContent) };
}
