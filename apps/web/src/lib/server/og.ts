import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import themeCss from "@lunacea/ui/foundations/theme.css?raw";

function darkThemeValue(property: string): string {
  const match = themeCss.match(
    new RegExp(`--${property}:\\s*light-dark\\(\\s*#[0-9a-fA-F]+,\\s*(#[0-9a-fA-F]+)\\s*\\)`),
  );
  if (!match?.[1]) throw new Error(`Missing dark theme value for --${property}`);
  return match[1];
}

const palette = {
  background: darkThemeValue("color-background"),
  foreground: darkThemeValue("color-foreground"),
  secondary: darkThemeValue("color-secondary"),
  accent: darkThemeValue("color-accent"),
  muted: darkThemeValue("color-muted"),
  forest: darkThemeValue("color-forest"),
};

export function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderOgSvg({
  eyebrow,
  title,
  subtitle,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}): string {
  // design-literal: OGP is a fixed 1200x630 raster canvas, not responsive UI.
  const titleSize = compact ? 58 : 76;
  const titleHeight = compact ? 280 : 130;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${palette.background}"/>
    <line x1="90" y1="70" x2="90" y2="560" stroke="${palette.forest}" stroke-width="2"/>
    <line x1="90" y1="560" x2="1110" y2="560" stroke="${palette.forest}" stroke-width="2"/>
    <polygon points="800,70 1110,220 1110,560 800,560" fill="${palette.foreground}" fill-opacity=".07" stroke="${palette.secondary}"/>
    <ellipse cx="930" cy="400" rx="112" ry="178" fill="none" stroke="${palette.forest}" stroke-width="5"/>
    <ellipse cx="930" cy="400" rx="112" ry="34" fill="none" stroke="${palette.secondary}" stroke-width="2"/>
    <circle cx="1030" cy="140" r="80" fill="${palette.accent}" fill-opacity=".18"/>
    <text x="130" y="135" fill="${palette.secondary}" font-family="sans-serif" font-size="24" letter-spacing="4">${
    escapeXml(eyebrow)
  }</text>
    <foreignObject x="130" y="${compact ? 205 : 225}" width="760" height="${titleHeight}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color:${palette.foreground};font:600 ${titleSize}px/1.28 sans-serif;letter-spacing:-2px">${
    escapeXml(title)
  }</div>
    </foreignObject>
    ${
    subtitle
      ? `<text x="130" y="420" fill="${palette.muted}" font-family="sans-serif" font-size="32">${
        escapeXml(subtitle)
      }</text>`
      : ""
  }
    <text x="130" y="535" fill="${palette.muted}" font-family="monospace" font-size="22">blog.lunacea.jp</text>
  </svg>`;
}

export async function ogPngResponse(svg: string): Promise<Response> {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export async function coverOgPngResponse(
  src: string,
  title: string,
  eyebrow: string,
): Promise<Response> {
  const input = await readFile(resolve(process.cwd(), "static", src.replace(/^\//u, "")));
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${palette.background}" stop-opacity=".9"/><stop offset=".72" stop-color="${palette.background}" stop-opacity=".18"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <text x="84" y="104" fill="${palette.accent}" font-family="sans-serif" font-size="22" letter-spacing="4">${
    escapeXml(eyebrow)
  }</text>
    <foreignObject x="84" y="172" width="760" height="330"><div xmlns="http://www.w3.org/1999/xhtml" style="color:${palette.foreground};font:600 62px/1.25 sans-serif;letter-spacing:-2px">${
    escapeXml(title)
  }</div></foreignObject>
    <text x="84" y="560" fill="${palette.muted}" font-family="monospace" font-size="22">blog.lunacea.jp</text>
  </svg>`;
  const png = await sharp(input).resize(1200, 630, { fit: "cover", withoutEnlargement: false })
    .composite([{ input: Buffer.from(overlay) }]).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
