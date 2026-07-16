import { error } from "@sveltejs/kit";
import { allContent, findContent, listContent, loadContentModule } from "@lunacea/content";
import { relatedContent } from "@lunacea/core/related.ts";
export const prerender = true;
export function entries() {
  return listContent("work").map(({ slug }) => ({ slug }));
}
export async function load({ params }) {
  const metadata = findContent("work", params.slug);
  if (!metadata) error(404, "Work not found");
  const module = await loadContentModule("work", params.slug);
  return {
    metadata,
    component: module.default,
    headings: module.headings,
    related: relatedContent(metadata, allContent),
  };
}
