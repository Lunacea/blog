import { siteConfig } from "@lunacea/config";
import { absoluteHref, publishedFeedContent, xml } from "$lib/server/feed.ts";

export const prerender = true;
export function GET() {
  const items = publishedFeedContent.map((entry) =>
    "<item><title>" + xml(entry.title) + "</title><link>" + absoluteHref(entry) +
    "</link><guid>" + absoluteHref(entry) + "</guid><pubDate>" +
    new Date(entry.publishedAt).toUTCString() + "</pubDate><description>" +
    xml(entry.summary) + "</description></item>"
  ).join("");
  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0"><channel><title>' + xml(siteConfig.name) + "</title><link>" +
    siteConfig.url + "</link><description>" + xml(siteConfig.description) +
    "</description>" + items + "</channel></rss>";
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
