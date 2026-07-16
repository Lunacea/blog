import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";
import { ogPngResponse, renderOgSvg } from "$lib/server/og.ts";

export const prerender = true;
export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}

export function GET({ params }) {
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  return ogPngResponse(renderOgSvg({
    eyebrow: content.type.toUpperCase() + " / LUNACEA",
    title: content.title,
    compact: true,
  }));
}
