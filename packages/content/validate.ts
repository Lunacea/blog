import { parse as parseYaml } from "@std/yaml";
import { type Content, contentId, contentSchema } from "@lunacea/schemas";
import linkPreviews from "./link-previews.json" with { type: "json" };

async function collectFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) files.push(...await collectFiles(path));
    else if (entry.isFile && entry.name.endsWith(".svx")) files.push(path);
  }
  return files;
}

function frontmatter(source: string, path: string): unknown {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) throw new Error(`${path}: frontmatter is missing`);
  return parseYaml(match[1]);
}

const files = await collectFiles(new URL("./entries", import.meta.url).pathname);
const ids = new Set<string>();
const paths = new Set<string>();
const errors: string[] = [];
const records: Array<{ path: string; source: string; content: Content }> = [];

function href(content: Content): string {
  if (content.type === "article") return `/articles/${content.slug}`;
  if (content.type === "work") return `/works/${content.slug}`;
  return `/archive/${content.type}s/${content.slug}`;
}

for (const path of files) {
  try {
    const source = await Deno.readTextFile(path);
    if (/!\[[^\]]*\]\(https?:\/\//u.test(source) || /<img[^>]+src=["']https?:\/\//u.test(source)) {
      errors.push(`${path}: remote images are not allowed`);
    }
    for (
      const match of source.matchAll(/<LinkCard\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gu)
    ) {
      if (!(match[1] in linkPreviews)) {
        errors.push(`${path}: link preview cache is missing: ${match[1]}`);
      }
    }
    const parsed = contentSchema.parse(frontmatter(source, path)) as Content;
    const id = contentId(parsed);
    if (ids.has(id)) errors.push(`${path}: duplicate content id ${id}`);
    ids.add(id);
    for (const alias of parsed.legacyIds) {
      if (ids.has(alias)) errors.push(`${path}: duplicate content id or alias ${alias}`);
      ids.add(alias);
    }
    const canonicalPath = href(parsed);
    if (paths.has(canonicalPath)) errors.push(`${path}: duplicate content path ${canonicalPath}`);
    paths.add(canonicalPath);
    for (const alias of parsed.legacyPaths) {
      if (paths.has(alias)) errors.push(`${path}: duplicate content path or alias ${alias}`);
      paths.add(alias);
    }
    if (!path.endsWith(`/${parsed.slug}/index.svx`)) {
      errors.push(`${path}: slug must match its directory name`);
    }
    records.push({ path, source, content: parsed });
    if (parsed.cover && parsed.cover.kind !== "placeholder") {
      if (!/\.(?:avif|webp)$/u.test(parsed.cover.src)) {
        errors.push(`${path}: cover must use a local AVIF or WebP asset`);
      }
      const asset = new URL(`../../apps/web/static${parsed.cover.src}`, import.meta.url);
      try {
        await Deno.stat(asset);
      } catch {
        errors.push(`${path}: cover asset does not exist: ${parsed.cover.src}`);
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

const knownRoutes = new Set([
  "/",
  "/articles",
  "/rss.xml",
  "/atom.xml",
  "/sitemap.xml",
  ...records.map((record) => href(record.content)),
]);

for (const { path, source, content } of records) {
  for (const related of content.related) {
    if (!ids.has(related)) errors.push(`${path}: related content does not exist: ${related}`);
  }
  const destinations = [
    ...source.matchAll(/(?<!!)\[[^\]]*\]\((\/[^)\s]+)\)/gu),
    ...source.matchAll(/href=["'](\/[^"']+)["']/gu),
  ].map((match) => match[1]);
  for (const destination of destinations) {
    const route = destination.split(/[?#]/u)[0].replace(/\/$/u, "") || "/";
    if (route.startsWith("/images/")) {
      try {
        await Deno.stat(new URL(`../../apps/web/static${route}`, import.meta.url));
      } catch {
        errors.push(`${path}: linked asset does not exist: ${route}`);
      }
    } else if (!knownRoutes.has(route)) {
      errors.push(`${path}: internal link does not exist: ${route}`);
    }
  }
}

if (files.length === 0) errors.push("No content files found");

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  Deno.exit(1);
}

console.log(`Validated ${files.length} content entries.`);
