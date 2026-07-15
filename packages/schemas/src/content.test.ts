import { assert, assertEquals } from "@std/assert";
import { contentId, contentSchema } from "./content.ts";

Deno.test("content schema normalizes YAML dates and supplies safe defaults", () => {
  const parsed = contentSchema.parse({
    type: "article",
    slug: "typed-content",
    title: "型で守るコンテンツ",
    summary: "公開前にメタデータの不整合を検出するための十分に長い概要です。",
    publishedAt: new Date("2026-04-02T00:00:00.000Z"),
    category: "engineering",
  });

  assertEquals(parsed.publishedAt, "2026-04-02");
  assertEquals(parsed.status, "stable");
  assertEquals(parsed.sample, true);
  assertEquals(contentId(parsed), "article:typed-content");
});

Deno.test("content schema rejects an update before publication", () => {
  const parsed = contentSchema.safeParse({
    type: "moment",
    slug: "time-order",
    title: "時間順序",
    summary: "更新日が公開日より古いデータを公開しないための検証用レコードです。",
    publishedAt: "2026-04-02",
    updatedAt: "2026-04-01",
  });

  assert(!parsed.success);
  assertEquals(parsed.error.issues[0].path, ["updatedAt"]);
});
