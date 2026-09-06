import { parse as parseYaml } from "@std/yaml";
import { analyzeArticleComposition } from "./composition.ts";

const entries = new URL("./entries/", import.meta.url);
const output = new URL("./.generated/metadata.ts", import.meta.url);
const compositionOutput = new URL("./.generated/composition.ts", import.meta.url);
const records: Record<string, unknown> = {};
const compositions: Record<string, unknown> = {};

async function walk(directory: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const child = new URL(entry.name + (entry.isDirectory ? "/" : ""), directory);
    if (entry.isDirectory) files.push(...await walk(child));
    else if (entry.isFile && entry.name.endsWith(".svx")) files.push(child);
  }
  return files;
}

for (const file of await walk(entries)) {
  const source = await Deno.readTextFile(file);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) throw new Error(`${file.pathname}: frontmatter is missing`);
  const relative = `./entries/${file.pathname.split("/entries/")[1]}`;
  const metadata = parseYaml(match[1]) as { type?: string; slug?: string };
  records[relative] = metadata;
  if (metadata.type === "article" && metadata.slug) {
    compositions[metadata.slug] = analyzeArticleComposition(source);
  }
}

await Deno.mkdir(new URL("./", output), { recursive: true });
await Deno.writeTextFile(
  output,
  `export const metadataModules = ${JSON.stringify(records, null, 2)} as const;\n`,
);
console.log(`Generated metadata manifest for ${Object.keys(records).length} entries.`);
await Deno.writeTextFile(
  compositionOutput,
  `export const generatedArticleCompositions = ${
    JSON.stringify(compositions, null, 2)
  } as const;\n`,
);
console.log(`Generated composition manifest for ${Object.keys(compositions).length} articles.`);
