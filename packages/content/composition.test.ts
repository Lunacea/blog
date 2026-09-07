import { assertEquals, assertGreater } from "@std/assert";
import { analyzeArticleComposition, paperLayerCount } from "./composition.ts";

Deno.test("composition preserves text, code, math and media source order", () => {
  const result = analyzeArticleComposition(`---
slug: sample
---
<script>const hidden = 'ignored';</script>
## Introduction
本文
~~~ts
const answer = 42;
~~~
![figure](/sample.webp)
後半 $x+y$ 終わり
## Diagram
~~~mermaid
flowchart LR
A --> B
~~~
$$
a+b
$$
`);
  assertEquals(result.sections.map((section) => section.id), ["introduction", "diagram"]);
  assertEquals(result.blocks.map((block) => block.kind), [
    "text",
    "text",
    "technical",
    "media",
    "text",
    "technical",
    "text",
    "text",
    "media",
    "technical",
  ]);
  assertGreater(result.estimatedMinutes, 0);
  assertEquals(result.blocks[0].start, 0);
  assertEquals(result.blocks.at(-1)?.end, 1);
  assertEquals(
    result.blocks.every((block, i) => !i || block.start === result.blocks[i - 1].end),
    true,
  );
});
Deno.test("character count excludes source metadata, scripts, code and image URLs", () => {
  const result = analyzeArticleComposition(
    "---\ntitle: ignored\n---\n<script>ignored</script>\n本文 [文字](https://example.com) ![画像](/image.webp)\n\n```ts\nignore()\n```",
  );
  assertEquals(result.textCharacters, 4);
});
Deno.test("empty composition and duplicate headings have stable identities", () => {
  assertEquals(analyzeArticleComposition("---\ntype: article\n---\n"), {
    estimatedMinutes: 0,
    textCharacters: 0,
    paperLayers: 1,
    blocks: [],
    sections: [],
  });
  assertEquals(analyzeArticleComposition("## 同じ\n本文\n### 同じ\n次").sections.map((s) => s.id), [
    "同じ",
    "同じ-1",
  ]);
});
Deno.test("paper layers follow reading minutes and cap at five", () => {
  assertEquals([0, 1, 2, 2.1, 4, 5, 9, 40].map(paperLayerCount), [1, 1, 2, 3, 4, 5, 5, 5]);
});
Deno.test("a long article stacks one sheet for each of its reading minutes", () => {
  const result = analyzeArticleComposition(`---\nslug: long\n---\n${"文".repeat(1500)}`);
  assertEquals(result.estimatedMinutes, 4);
  assertEquals(result.paperLayers, 4);
});
