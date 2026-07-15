import { siteConfig } from "@lunacea/config";
export const prerender = true;
export function GET() {
  const body = siteConfig.sampleMode
    ? "User-agent: *\nDisallow: /\n"
    : "User-agent: *\nAllow: /\nSitemap: " + siteConfig.url + "/sitemap.xml\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
