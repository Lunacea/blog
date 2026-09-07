import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";
import { ogPngResponse } from "$lib/server/og.ts";
import type { RequestHandler } from "./$types.d.ts";

export const prerender = true;
export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}

export const GET: RequestHandler = async ({ params }) => {
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  return await ogPngResponse({
    category: content.type === "article" ? content.category : content.type,
    title: content.title,
    tags: content.tags,
  });
};
