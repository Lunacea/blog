import { Buffer } from "node:buffer";
import sharp from "sharp";

export const prerender = true;

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#0c100e"/>
    <path d="M90 70v490M90 560h1020" stroke="#294d3a" stroke-width="2"/>
    <path d="M760 70l350 165v325H760z" fill="#d2eee0" fill-opacity=".07" stroke="#7fa28a"/>
    <path d="M920 222c70 34 112 99 112 178s-42 144-112 178c-70-34-112-99-112-178s42-144 112-178Z" fill="none" stroke="#294d3a" stroke-width="5"/>
    <ellipse cx="920" cy="400" rx="112" ry="34" fill="none" stroke="#7fa28a" stroke-width="2"/>
    <circle cx="1030" cy="140" r="80" fill="#e0c452" fill-opacity=".18"/>
    <text x="130" y="155" fill="#7fa28a" font-family="sans-serif" font-size="24" letter-spacing="5">PERSONAL ARCHIVE / MORIOKA</text>
    <text x="130" y="305" fill="#e7ece7" font-family="sans-serif" font-size="76" font-weight="600">Lunacea</text>
    <text x="130" y="390" fill="#a9b4ad" font-family="sans-serif" font-size="32">code, research, and quiet records</text>
    <text x="130" y="535" fill="#a9b4ad" font-family="monospace" font-size="22">blog.lunacea.jp</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
