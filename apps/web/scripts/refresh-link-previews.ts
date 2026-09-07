import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type LinkPreview = {
  href: string;
  site: string;
  title: string;
  description: string;
  image?: string;
};

const contentRoot = new URL("../../../packages/content/entries/", import.meta.url);
const cacheFile = new URL("../../../packages/content/link-previews.json", import.meta.url);
const imageRoot = new URL("../static/images/ogp/external/", import.meta.url);
const htmlLimit = 2 * 1024 * 1024;
const imageLimit = 6 * 1024 * 1024;
const timeout = 12_000;

async function collectContent(directory: URL): Promise<URL[]> {
  const files: URL[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) files.push(...await collectContent(child));
    else if (entry.isFile() && entry.name.endsWith(".svx")) files.push(child);
  }
  return files;
}

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase();
  if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7));
  if (
    value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") ||
    /^fe[89ab]/u.test(value)
  ) {
    return true;
  }
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) return false;
  return octets[0] === 0 || octets[0] === 10 || octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

async function assertPublicUrl(url: URL, allowPrivate = false): Promise<void> {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported link preview protocol: ${url.protocol}`);
  }
  if (allowPrivate) return;
  if (
    url.hostname === "localhost" || url.hostname.endsWith(".local") ||
    isPrivateAddress(url.hostname)
  ) {
    throw new Error(`Private link preview host is not allowed: ${url.hostname}`);
  }
  const addresses = await lookup(url.hostname, { all: true }).then((results) =>
    results.map(({ address }) => address)
  );
  if (!addresses.length) {
    throw new Error(`Link preview host could not be resolved: ${url.hostname}`);
  }
  if (addresses.some(isPrivateAddress)) {
    throw new Error(`Link preview host resolves to a private address: ${url.hostname}`);
  }
}

async function boundedFetch(
  initial: URL,
  limit: number,
  accept: string,
  allowPrivate = false,
): Promise<{ bytes: Uint8Array; type: string; url: URL }> {
  let url = initial;
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    await assertPublicUrl(url, allowPrivate);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeout),
      headers: {
        accept,
        "user-agent": "Lunacea link preview refresh/1.0",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect without location: ${url}`);
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > limit) throw new Error(`Response exceeds ${limit} bytes: ${url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > limit) throw new Error(`Response exceeds ${limit} bytes: ${url}`);
    return {
      bytes,
      type: response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "",
      url,
    };
  }
  throw new Error(`Too many redirects: ${initial}`);
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu"));
  return match?.[2]?.trim();
}

function meta(html: string, kind: "property" | "name", key: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/giu)) {
    const tag = match[0];
    if (attribute(tag, kind)?.toLowerCase() !== key) continue;
    const value = attribute(tag, "content");
    if (value) return value.replace(/\s+/gu, " ");
  }
}

function documentTitle(html: string): string | undefined {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1]?.trim().replace(/\s+/gu, " ");
}

export async function refreshPreview(
  href: string,
  previous?: LinkPreview,
  allowPrivate = false,
  outputRoot = imageRoot,
): Promise<LinkPreview> {
  const requested = new URL(href);
  const html = await boundedFetch(
    requested,
    htmlLimit,
    "text/html,application/xhtml+xml",
    allowPrivate,
  );
  if (!["text/html", "application/xhtml+xml"].includes(html.type)) {
    throw new Error(`Expected HTML but received ${html.type || "unknown"}: ${href}`);
  }
  const source = new TextDecoder().decode(html.bytes);
  const title = meta(source, "property", "og:title") ??
    meta(source, "name", "twitter:title") ?? documentTitle(source);
  const description = meta(source, "property", "og:description") ??
    meta(source, "name", "twitter:description") ?? meta(source, "name", "description");
  if (!title || !description) throw new Error(`Missing title or description: ${href}`);

  const imageHref = meta(source, "property", "og:image:secure_url") ??
    meta(source, "property", "og:image") ?? meta(source, "name", "twitter:image");
  let image = previous?.image;
  if (imageHref) {
    const remoteImage = await boundedFetch(
      new URL(imageHref, html.url),
      imageLimit,
      "image/avif,image/webp,image/png,image/jpeg",
      allowPrivate,
    );
    if (!remoteImage.type.startsWith("image/")) {
      throw new Error(`Expected image but received ${remoteImage.type || "unknown"}: ${imageHref}`);
    }
    const stem = createHash("sha256").update(href).digest("hex").slice(0, 16);
    const filename = `${stem}.webp`;
    await mkdir(outputRoot, { recursive: true });
    await sharp(remoteImage.bytes)
      .resize({ width: 1200, height: 630, fit: "cover", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(fileURLToPath(new URL(filename, outputRoot)));
    image = `/images/ogp/external/${filename}`;
  }
  return {
    href,
    site: requested.hostname.replace(/^www\./u, ""),
    title,
    description,
    ...(image ? { image } : {}),
  };
}

async function main(): Promise<void> {
  const files = await collectContent(contentRoot);
  const hrefs = new Set<string>();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/<LinkCard\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gu)) {
      hrefs.add(match[1]);
    }
  }
  const previous = JSON.parse(await readFile(cacheFile, "utf8")) as Record<string, LinkPreview>;
  const next = { ...previous };
  const errors: string[] = [];
  for (const href of [...hrefs].sort()) {
    try {
      next[href] = await refreshPreview(href, previous[href]);
      console.log(`Refreshed ${href}`);
    } catch (error) {
      errors.push(`${href}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  const temporary = new URL(`${cacheFile.pathname}.tmp`, cacheFile);
  await writeFile(temporary, JSON.stringify(next, null, 2) + "\n");
  await rename(temporary, cacheFile);
}

if (import.meta.main) await main();
