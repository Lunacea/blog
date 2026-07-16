import { siteConfig } from "@lunacea/config";
import { absoluteHref, publishedFeedContent, xml } from "$lib/server/feed.ts";

export const prerender = true;
export function GET() {
  const staticPages = [
    "/",
    "/articles",
    "/works",
    "/archive",
  ];
  const publishedTags = [...new Set(publishedFeedContent.flatMap((entry) => entry.tags))];
  const urls = [
    ...staticPages.map((path) => siteConfig.url + path),
    ...publishedTags.map((tag) => `${siteConfig.url}/tags/${encodeURIComponent(tag)}`),
    ...publishedFeedContent.map(absoluteHref),
  ];
  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.map((url) => "<url><loc>" + xml(url) + "</loc></url>").join("") +
    "</urlset>";
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
