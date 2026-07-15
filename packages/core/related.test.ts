import { assertEquals } from "@std/assert";
import { type Content, contentSchema } from "@lunacea/schemas";
import { relatedContent } from "./related.ts";

function article(
  slug: string,
  tags: string[],
  publishedAt: string,
  related: string[] = [],
): Content {
  return contentSchema.parse({
    type: "article",
    slug,
    title: `記事 ${slug}`,
    summary: "関連記事の順位を安定して検証するために用意した十分に長い概要です。",
    publishedAt,
    tags,
    category: "engineering",
    related,
  });
}

Deno.test("manual related content wins over tag similarity", () => {
  const target = article("target", ["Svelte", "Deno"], "2026-01-01", ["article:manual"]);
  const manual = article("manual", ["Other"], "2024-01-01");
  const similar = article("similar", ["Svelte", "Deno"], "2026-02-01");
  assertEquals(relatedContent(target, [target, similar, manual]).map((entry) => entry.slug), [
    "manual",
    "similar",
  ]);
});
