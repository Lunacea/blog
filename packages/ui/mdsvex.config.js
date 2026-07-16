// @ts-nocheck -- mdsvex's unified plugin types do not model the current rehype packages.
import { transformerMetaHighlight } from "@shikijs/transformers";
import { mdsvex } from "mdsvex";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { codeToHtml } from "shiki";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function metadataValue(metadata, key) {
  return new RegExp(`${key}="([^"]+)"`, "u").exec(metadata)?.[1];
}

function dollarMathNodes(value) {
  const nodes = [];
  const pattern = /\$([^$\n]+)\$/gu;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push({ type: "text", value: value.slice(cursor, index) });
    nodes.push({
      type: "element",
      tagName: "span",
      properties: { className: ["math-inline"] },
      children: [{ type: "text", value: match[1] }],
    });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) nodes.push({ type: "text", value: value.slice(cursor) });
  return nodes;
}

function rehypeDollarMath() {
  return (tree) => {
    function transform(node, parent, index, excluded = false) {
      const isElement = node.type === "element";
      const tagName = isElement ? node.tagName : "";
      const skip = excluded || ["code", "pre", "script", "style"].includes(tagName);

      if (isElement && tagName === "p" && node.children?.every((child) => child.type === "text")) {
        const value = node.children.map((child) => child.value).join("");
        const display = /^\$\$\s*([\s\S]*?)\s*\$\$$/u.exec(value);
        if (display && parent && typeof index === "number") {
          parent.children[index] = {
            type: "element",
            tagName: "div",
            properties: { className: ["math-display"] },
            children: [{ type: "text", value: display[1] }],
          };
          return;
        }
      }

      if (!skip && node.type === "text" && node.value.includes("$") && parent) {
        const replacements = dollarMathNodes(node.value);
        if (replacements.length > 1) {
          parent.children.splice(index, 1, ...replacements);
          return;
        }
      }

      if (!node.children) return;
      for (let childIndex = node.children.length - 1; childIndex >= 0; childIndex -= 1) {
        transform(node.children[childIndex], node, childIndex, skip);
      }
    }

    transform(tree, null, undefined);
  };
}

export function createEditorialPreprocessor() {
  return mdsvex({
    extensions: [".svx"],
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      rehypeDollarMath,
      [rehypeKatex, { strict: "warn", trust: false }],
    ],
    highlight: {
      highlighter: async (code, language = "text", metadata = "") => {
        const title = metadataValue(metadata, "title");
        if (language === "mermaid") {
          return '<pre class="mermaid-source"' +
            (title ? ' data-title="' + escapeHtml(title) + '"' : "") +
            "><code>" + escapeHtml(code) + "</code></pre>";
        }
        const html = await codeToHtml(code, {
          lang: language || "text",
          themes: { light: "github-light", dark: "github-dark" },
          meta: { __raw: metadata },
          transformers: [transformerMetaHighlight()],
        });
        const wrapped = '<div class="code-block"' +
          (title ? ' data-title="' + escapeHtml(title) + '"' : "") +
          ">" + html + "</div>";
        return "{@html " + JSON.stringify(wrapped) + "}";
      },
    },
  });
}
