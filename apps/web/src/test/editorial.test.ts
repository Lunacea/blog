import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createEditorialPreprocessor } from "../../../../packages/ui/mdsvex.config.js";

describe("editorial SVX compilation", () => {
  it("produces accessible static code and math HTML without a client runtime", async () => {
    const filename = "../../packages/ui/src/patterns/fixtures/EditorialSample.svx";
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
