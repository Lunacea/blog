import { error } from "@sveltejs/kit";
import {
  allContent,
  articleComposition,
  findContent,
  listContent,
  loadContentModule,
} from "@lunacea/content";
import { relatedContent } from "@lunacea/core/related.ts";

export const prerender = true;
export function entries() {
  return listContent("article").map(({ slug }) => ({ slug }));
}
export async function load({ params }) {
  const metadata = findContent("article", params.slug);
  if (!metadata || metadata.type !== "article") error(404, "Article not found");
  const module = await loadContentModule("article", params.slug);
  return {
    metadata,
    component: module.default,
    headings: module.headings,
    related: relatedContent(metadata, allContent).filter((entry) => entry.type === "article"),
    composition: articleComposition(metadata.slug),
  };
}
