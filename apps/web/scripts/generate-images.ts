import sharp from "sharp";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const sourceRoot = new URL("../static/images/archive/", import.meta.url);
const outputRoot = new URL("../static/images/generated/", import.meta.url);
const legacyOutputRoot = new URL("../static/images/.generated/", import.meta.url);
const moduleOutput = new URL("../src/lib/.generated/images.ts", import.meta.url);
const widths = [480, 800, 1200];
/*
 * アイデンティティマークは 960px で作られているが名刺の枠より大きく描かれないため、
 * 解像度倍率の小さな段階だけを用意する。元 PNG をそのまま配ると 56px の絵に 0.5MB かかる。
 */
const markRoot = new URL("../static/images/", import.meta.url);
const markWidths = [56, 112, 168];

type Variant = { avif: string; webp: string; width: number };
type Source = {
  root: URL;
  pattern: RegExp;
  publicPath: (name: string) => string;
  widths: number[];
  quality: { avif: number; webp: number };
};

const sources: Source[] = [
  {
    root: sourceRoot,
    pattern: /\.(?:avif|webp)$/u,
    publicPath: (name) => `/images/archive/${name}`,
    widths,
    quality: { avif: 62, webp: 76 },
  },
  {
    root: markRoot,
    pattern: /\.png$/u,
    publicPath: (name) => `/images/${name}`,
    widths: markWidths,
    quality: { avif: 70, webp: 82 },
  },
];

async function exists(url: URL) {
  try {
    await Deno.stat(url);
    return true;
  } catch {
    return false;
  }
}

/*
 * 出力の名前は元画像のハッシュを含むので、同じ名前があれば中身も同じ。起動のたびに全部を作り直すと
 * 開発サーバーと E2E の立ち上がりが数十秒遅れるため、足りない変換だけを作り、使われなくなった
 * 出力を最後に消す。
 */
await Deno.remove(legacyOutputRoot, { recursive: true }).catch(() => undefined);
await Deno.mkdir(outputRoot, { recursive: true });
await Deno.mkdir(new URL("./", moduleOutput), { recursive: true });

const manifest: Record<string, Variant[]> = {};
const expected = new Set<string>();
let created = 0;

for (const source of sources) {
  for await (const entry of Deno.readDir(source.root)) {
    if (!entry.isFile || !source.pattern.test(entry.name)) continue;
    const input = await Deno.readFile(new URL(entry.name, source.root));
    const metadata = await sharp(input).metadata();
    if (!metadata.width) throw new Error(`Missing image width: ${entry.name}`);
    const stem = entry.name.replace(/\.[^.]+$/u, "");
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 10);
    const variants: Variant[] = [];
    for (const width of source.widths.filter((candidate) => candidate <= metadata.width!)) {
      const base = `${stem}.${hash}.${width}`;
      for (const format of ["avif", "webp"] as const) {
        const file = `${base}.${format}`;
        expected.add(file);
        const target = new URL(file, outputRoot);
        if (await exists(target)) continue;
        const resized = sharp(input).resize({ width, withoutEnlargement: true });
        await (format === "avif"
          ? resized.avif({ quality: source.quality.avif })
          : resized.webp({ quality: source.quality.webp })).toFile(fileURLToPath(target));
        created += 1;
      }
      variants.push({
        avif: `/images/generated/${base}.avif`,
        webp: `/images/generated/${base}.webp`,
        width,
      });
    }
    manifest[source.publicPath(entry.name)] = variants;
  }
}

let removed = 0;
for await (const entry of Deno.readDir(outputRoot)) {
  if (entry.isFile && !expected.has(entry.name)) {
    await Deno.remove(new URL(entry.name, outputRoot));
    removed += 1;
  }
}

// 中身が同じなら書き込まない。書くと開発サーバーが画像の対応表を読み直して画面を再読み込みする。
const module = `export const responsiveImages = ${JSON.stringify(manifest, null, 2)} as const;\n`;
const previous = await Deno.readTextFile(moduleOutput).catch(() => "");
if (previous !== module) await Deno.writeTextFile(moduleOutput, module);

console.log(
  `Responsive variants for ${Object.keys(manifest).length} images: ${created} created, ` +
    `${removed} removed.`,
);
