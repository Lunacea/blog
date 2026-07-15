import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { codeToHtml } from "shiki";
import { transformerMetaHighlight } from "@shikijs/transformers";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const config = {
  extensions: [".svelte", ".svx"],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: [".svx"],
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        rehypeKatex,
      ],
      highlight: {
        highlighter: async (code, language = "text", meta = "") => {
          if (language === "mermaid") {
            return '<pre class="mermaid-source"><code>' + escapeHtml(code) + "</code></pre>";
          }
          const title = /title="([^"]+)"/u.exec(meta)?.[1];
          const html = await codeToHtml(code, {
            lang: language || "text",
            themes: { light: "github-light", dark: "github-dark" },
            meta: { __raw: meta },
            transformers: [transformerMetaHighlight()],
          });
          const wrapped = '<div class="code-block"' +
            (title ? ' data-title="' + escapeHtml(title) + '"' : "") +
            ">" + html + "</div>";
          return "{@html " + JSON.stringify(wrapped) + "}";
        },
      },
    }),
  ],
  kit: {
    adapter: adapter(),
    alias: {
      "$ui": "../../packages/ui/src",
      "$content": "../../packages/content",
      "$core": "../../packages/core",
      "@lunacea/api": "../../packages/api/mod.ts",
      "@lunacea/config": "../../packages/config/mod.ts",
      "@lunacea/content": "../../packages/content/mod.ts",
      "@lunacea/content/*": "../../packages/content/*",
      "@lunacea/core/*": "../../packages/core/*",
      "@lunacea/schemas": "../../packages/schemas/mod.ts",
      "@lunacea/tokens/*": "../../packages/tokens/*",
      "@lunacea/ui/*": "../../packages/ui/src/*",
    },
  },
};

export default config;
