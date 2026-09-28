import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createEditorialPreprocessor } from "../mdsvex.config.js";

describe("editorial SVX compilation", () => {
  it("produces accessible static code and math HTML without a client runtime", async () => {
    const filename = "stories/articles/fixtures/EditorialSample.svx";
    const content = await readFile(filename, "utf8");
    const preprocessor = createEditorialPreprocessor();
    const result = await preprocessor.markup({ content, filename });

    expect(result?.code).toContain('class=\\"code-block\\"');
    expect(result?.code).toContain('class="mermaid-source"');
    expect(result?.code).toContain('data-title="公開パイプライン"');
    expect(result?.code).toContain('class="katex"');
    expect(result?.code).toContain('class="katex-display"');
  });
});

describe("soft line breaks", () => {
  it("drops breaks next to Japanese text and keeps them between Latin words", async () => {
    const preprocessor = createEditorialPreprocessor();
    const content = [
      "対応できます．",
      "しかし，<mark>階層型</mark>",
      "と[並列型](https://example.com)で，",
      "**List-detail**",
      "と呼びます．",
      "",
      "English line",
      "stays spaced.",
    ].join("\n");
    const result = await preprocessor.markup({ content, filename: "sample.svx" });

    expect(result?.code).toContain(
      '対応できます．しかし，<mark>階層型</mark>と<a href="https://example.com"',
    );
    expect(result?.code).toContain("で，<strong>List-detail</strong>と呼びます．");
    expect(result?.code).toContain("English line\nstays spaced.");
  });
});
