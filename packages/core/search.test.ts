import { assertEquals } from "@std/assert";
import { searchContent, type SearchDocument, tokenize } from "./search.ts";

const documents: SearchDocument[] = [
  {
    id: "article:weather-design",
    type: "article",
    slug: "weather-design",
    title: "天候を環境情報にする",
    summary: "盛岡の空模様を穏やかに反映します。",
    tags: ["Weather", "Design"],
    publishedAt: "2026-05-01",
    status: "stable",
    body: "Open-Meteoから得た値は情報配置を変えません。",
    href: "/articles/weather-design",
  },
  {
    id: "work:archive",
    type: "work",
    slug: "archive",
    title: "静かなアーカイブ",
    summary: "断片を長く保つための作品です。",
    tags: ["Archive"],
    publishedAt: "2025-01-01",
    status: "growing",
    body: "写真と場所を記録します。",
    href: "/works/archive",
  },
];

Deno.test("Japanese tokenizer includes words and bigrams", () => {
  const tokens = tokenize("盛岡の天候");
  assertEquals(tokens.includes("盛岡"), true);
  assertEquals(tokens.includes("天候"), true);
  assertEquals(tokens.includes("岡の"), true);
});

Deno.test("search weights title and applies filters", () => {
  assertEquals(searchContent(documents, "天候").map((entry) => entry.id), [
    "article:weather-design",
  ]);
  assertEquals(
    searchContent(documents, "", { type: "work", status: "growing" })[0].id,
    "work:archive",
  );
  assertEquals(searchContent(documents, "", { tag: "missing" }), []);
});
