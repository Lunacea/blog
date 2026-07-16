import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";
import { coverOgPngResponse, ogPngResponse, renderOgSvg } from "$lib/server/og.ts";

export const prerender = true;
export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}

export async function GET({ params }) {
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  if (content.cover && content.cover.kind !== "placeholder") {
    return await coverOgPngResponse(
      content.cover.src,
      content.title,
      content.type.toUpperCase() + " / LUNACEA",
    );
  }
  return ogPngResponse(renderOgSvg({
    eyebrow: content.type.toUpperCase() + " / LUNACEA",
    title: content.title,
    compact: true,
  }));
}
