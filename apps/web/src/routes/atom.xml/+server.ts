import { siteConfig } from "@lunacea/config";
import { absoluteHref, publishedFeedContent, stableFeedId, xml } from "$lib/server/feed.ts";

export const prerender = true;
export function GET() {
  const updated = publishedFeedContent[0]?.updatedAt ??
    publishedFeedContent[0]?.publishedAt ??
    "2026-07-14";
  const entries = publishedFeedContent.map((entry) =>
    "<entry><title>" + xml(entry.title) + "</title><id>" + stableFeedId(entry) +
    '</id><link href="' + absoluteHref(entry) + '"/><updated>' +
    new Date(entry.updatedAt ?? entry.publishedAt).toISOString() +
    "</updated><summary>" + xml(entry.summary) + "</summary></entry>"
  ).join("");
  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<feed xmlns="http://www.w3.org/2005/Atom"><title>' + xml(siteConfig.name) +
    "</title><id>" + siteConfig.url + '/</id><link href="' + siteConfig.url +
    '/atom.xml" rel="self"/><updated>' + new Date(updated).toISOString() +
    "</updated>" + entries + "</feed>";
  return new Response(body, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
}
