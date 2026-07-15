import { error } from "@sveltejs/kit";
import { allContent, findContent, listContent, loadContentModule } from "@lunacea/content";
import { relatedContent } from "@lunacea/core/related.ts";
export const prerender = true;
export function entries() {
  return listContent("talk").map(({ slug }) => ({ slug }));
}
export async function load({ params }) {
  const metadata = findContent("talk", params.slug);
  if (!metadata) error(404, "Talk not found");
  const module = await loadContentModule("talk", params.slug);
  return { metadata, component: module.default, related: relatedContent(metadata, allContent) };
}
