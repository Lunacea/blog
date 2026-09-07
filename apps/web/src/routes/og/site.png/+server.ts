import { ogSiteResponse } from "$lib/server/og.ts";

export const prerender = true;
export function GET() {
  return ogSiteResponse();
}
