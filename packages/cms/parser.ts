import { parse as parseYaml } from "yaml";
import { Frontmatter, ParsedPost } from "../../shared/types.ts";

/**
 * MDXを解析してメタデータとHTMLに分解します
 */
export function parseMDX(slug: string, mdxContent: string): ParsedPost {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = mdxContent.match(frontmatterRegex);

  let metadata: Frontmatter = {
    title: "Untitled",
    date: new Date().toISOString().split("T")[0],
    tags: [],
  };
  let markdownRaw = mdxContent;

  if (match) {
    try {
      const parsedYaml = parseYaml(match[1]) as Record<string, unknown>;
      metadata = {
        title: typeof parsedYaml.title === "string" ? parsedYaml.title : "Untitled",
        date: typeof parsedYaml.date === "string"
          ? parsedYaml.date
          : new Date().toISOString().split("T")[0],
        tags: Array.isArray(parsedYaml.tags) ? parsedYaml.tags.map(String) : [],
        description: typeof parsedYaml.description === "string"
          ? parsedYaml.description
          : undefined,
        syncToQiita: Boolean(parsedYaml.syncToQiita),
        syncToZenn: Boolean(parsedYaml.syncToZenn),
      };
      markdownRaw = mdxContent.substring(match[0].length);
    } catch {
      // 解析エラー時のフォールバック
    }
  }

  // 独自コンポーネントタグの検出ロジック
  const hasCustomUI = /<InteractiveUI\s+/.test(markdownRaw);

  return {
    slug,
    metadata,
    htmlContent: markdownRaw, // 後段のマークダウンパーサーで変換
    hasCustomUI,
  };
}
