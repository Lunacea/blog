import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";
import { ogPngResponse } from "$lib/server/og.ts";
import type { RequestHandler } from "./$types.d.ts";

export const prerender = false;

export const GET: RequestHandler = async ({ params }) => {
  if (!dev) error(404, "Not found");
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  return await ogPngResponse({
    title: content.title,
    category: content.type === "article" ? content.category : content.type,
    tags: content.tags,
  });
};

export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}
