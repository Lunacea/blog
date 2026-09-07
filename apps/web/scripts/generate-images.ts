import sharp from "sharp";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const sourceRoot = new URL("../static/images/archive/", import.meta.url);
const outputRoot = new URL("../static/images/generated/", import.meta.url);
const legacyOutputRoot = new URL("../static/images/.generated/", import.meta.url);
const moduleOutput = new URL("../src/lib/.generated/images.ts", import.meta.url);
const widths = [480, 800, 1200];
/*
 * The identity mark is authored at 960px but never drawn larger than the business card's portrait
 * slot, so it gets its own small ladder in device-pixel steps. Serving the source PNG cost half a
 * megabyte for a 56px picture.
 */
const markRoot = new URL("../static/images/", import.meta.url);
const markWidths = [56, 112, 168];
const manifest: Record<string, { avif: string; webp: string; width: number }[]> = {};

await Promise.all([
  Deno.remove(outputRoot, { recursive: true }).catch(() => undefined),
  Deno.remove(legacyOutputRoot, { recursive: true }).catch(() => undefined),
]);
await Deno.mkdir(outputRoot, { recursive: true });
await Deno.mkdir(new URL("./", moduleOutput), { recursive: true });

for await (const entry of Deno.readDir(sourceRoot)) {
  if (!entry.isFile || !/\.(?:avif|webp)$/u.test(entry.name)) continue;
  const source = new URL(entry.name, sourceRoot);
  const input = await Deno.readFile(source);
  const metadata = await sharp(input).metadata();
  if (!metadata.width) throw new Error(`Missing image width: ${entry.name}`);
  const stem = entry.name.replace(/\.[^.]+$/u, "");
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 10);
  const variants = [];
  for (const width of widths.filter((candidate) => candidate <= metadata.width!)) {
    const base = `${stem}.${hash}.${width}`;
    await sharp(input).resize({ width, withoutEnlargement: true }).avif({ quality: 62 })
      .toFile(fileURLToPath(new URL(`${base}.avif`, outputRoot)));
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 76 })
      .toFile(fileURLToPath(new URL(`${base}.webp`, outputRoot)));
    variants.push({
      avif: `/images/generated/${base}.avif`,
      webp: `/images/generated/${base}.webp`,
      width,
    });
  }
  manifest[`/images/archive/${entry.name}`] = variants;
}

for await (const entry of Deno.readDir(markRoot)) {
  if (!entry.isFile || !/\.png$/u.test(entry.name)) continue;
  const input = await Deno.readFile(new URL(entry.name, markRoot));
  const metadata = await sharp(input).metadata();
  if (!metadata.width) throw new Error(`Missing image width: ${entry.name}`);
  const stem = entry.name.replace(/\.[^.]+$/u, "");
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 10);
  const variants = [];
  for (const width of markWidths.filter((candidate) => candidate <= metadata.width!)) {
    const base = `${stem}.${hash}.${width}`;
    await sharp(input).resize({ width, withoutEnlargement: true }).avif({ quality: 70 })
      .toFile(fileURLToPath(new URL(`${base}.avif`, outputRoot)));
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 })
      .toFile(fileURLToPath(new URL(`${base}.webp`, outputRoot)));
    variants.push({
      avif: `/images/generated/${base}.avif`,
      webp: `/images/generated/${base}.webp`,
      width,
    });
  }
  manifest[`/images/${entry.name}`] = variants;
}

await Deno.writeTextFile(
  moduleOutput,
  `export const responsiveImages = ${JSON.stringify(manifest, null, 2)} as const;\n`,
);
console.log(`Generated responsive variants for ${Object.keys(manifest).length} images.`);
