import { ogPngResponse, renderOgSvg } from "$lib/server/og.ts";

export const prerender = true;

export function GET() {
  return ogPngResponse(renderOgSvg({
    eyebrow: "PERSONAL ARCHIVE / MORIOKA",
    title: "Lunacea",
    subtitle: "code, research, and quiet records",
  }));
}
