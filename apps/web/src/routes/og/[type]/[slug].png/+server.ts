import { Buffer } from "node:buffer";
import sharp from "sharp";
import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";

export const prerender = true;
export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function GET({ params }) {
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  const title = escape(content.title);
  const type = escape(content.type.toUpperCase());
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
    '<rect width="1200" height="630" fill="#0c100e"/>' +
    '<path d="M90 70v490M90 560h1020" stroke="#294d3a" stroke-width="2"/>' +
    '<path d="M800 70l310 150v340H800z" fill="#d2eee0" fill-opacity=".07" stroke="#7fa28a"/>' +
    '<circle cx="1030" cy="140" r="80" fill="#e0c452" fill-opacity=".18"/>' +
    '<text x="130" y="135" fill="#7fa28a" font-family="sans-serif" font-size="24" letter-spacing="4">' +
    type + " / LUNACEA</text>" +
    '<foreignObject x="130" y="205" width="760" height="280"><div xmlns="http://www.w3.org/1999/xhtml" ' +
    'style="color:#e7ece7;font:600 58px/1.28 sans-serif;letter-spacing:-2px">' + title +
    "</div></foreignObject>" +
    '<text x="130" y="535" fill="#a9b4ad" font-family="monospace" font-size="22">blog.lunacea.jp</text>' +
    "</svg>";
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
