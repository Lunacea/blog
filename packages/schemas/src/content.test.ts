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
  assertEquals(parsed.legacyIds, []);
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

Deno.test("talk articles require event metadata and an in-person venue", () => {
  const base = {
    type: "article",
    slug: "conference-note",
    title: "発表記録",
    summary: "発表の公開契約とイベント情報を検証するための十分に長い概要です。",
    publishedAt: "2026-04-02",
    category: "talk",
  } as const;

  assert(!contentSchema.safeParse(base).success);
  assert(
    !contentSchema.safeParse({
      ...base,
      event: {
        name: "Example Conference",
        heldAt: "2026-04-02",
        mode: "in-person",
        presentationType: "talk",
      },
    }).success,
  );
  assert(
    contentSchema.safeParse({
      ...base,
      event: {
        name: "Example Conference",
        heldAt: "2026-04-02",
        mode: "in-person",
        venue: "盛岡",
        presentationType: "talk",
      },
    }).success,
  );
});

Deno.test("non-talk articles reject event metadata", () => {
  const parsed = contentSchema.safeParse({
    type: "article",
    slug: "ordinary-article",
    title: "通常記事",
    summary: "通常記事へイベント固有情報を混在させないための十分に長い概要です。",
    publishedAt: "2026-04-02",
    category: "engineering",
    event: {
      name: "Example Conference",
      heldAt: "2026-04-02",
      mode: "online",
      presentationType: "talk",
    },
  });

  assert(!parsed.success);
});
