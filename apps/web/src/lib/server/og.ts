import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const fonts = resolve(process.cwd(), "../../packages/ui/fonts/source");
const latin = { file: `${fonts}/archivo/Archivo[wdth,wght].ttf`, family: "Archivo" };
const japanese = {
  file: `${fonts}/zen-kaku-gothic-new/ZenKakuGothicNew-Bold.ttf`,
  family: "Zen Kaku Gothic New Bold",
};
const portraitPath = resolve(process.cwd(), "static/images/Lunacea-nobg.png");
/** --font-sans と同じ順序。ラテンが Archivo、日本語が Zen に落ちる。 */
const display = "Archivo, Zen Kaku Gothic New Bold";
/** Pango の SemiExpanded は可変フォントの wdth 112 を選ぶ。題字と同じ幅。 */
const masthead = "Archivo SemiExpanded";

/** Pango の字間はポイントの 1024 分の1 単位。サイト側は em で宣言している。 */
function trackingFor(size: number, em: number): number {
  return Math.round(em * size * 1024);
}

/**
 * `fontfile` は描画ごとに1ファイルしか登録しないため、両方の face を最初に読み込む。
 * これがないと、最初の描画が読んだファイルへ暗黙にフォールバックする。
 */
let registration: Promise<unknown> | undefined;
function registerFonts() {
  registration ??= Promise.all(
    [latin.file, japanese.file].map((fontfile) =>
      sharp({ text: { text: "A", font: "Archivo 12", fontfile, dpi: 72, rgba: true } })
        .png()
        .toBuffer()
    ),
  );
  return registration;
}

/**
 * シェアカードは 1200x630 固定の書き出しなので、トークンではなく絶対値で宣言する。
 * 常にダークテーマ（他人のタイムライン上で読まれるため）。
 */
// design-literal: ダークテーマの --color-background / --color-foreground と対応。
const canvas = { width: 1200, height: 630, ground: "#111111", ink: "#eeeeec" };
// design-literal: 背景を構成する光と影の原色。
const light = "#ffffff";
// design-literal: 背景を構成する光と影の原色。
const shadow = "#000000";
// design-literal: ダークテーマの --color-surface と対応。
const surface = "#1b1b1b";
const margin = 72;
const chipHeight = 46;
const titleBaseline = 326;

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Pango は実際のローカルフォントの字形で計測・折り返しを行う（日本語や分割できない語も含む）。 */
async function textImage(
  text: string,
  size: number,
  width: number,
  font: { file: string; family: string },
  options: { height?: number; tracking?: number; colour?: string; weight?: number } = {},
) {
  await registerFonts();
  const tracking = options.tracking ? ` letter_spacing="${options.tracking}"` : "";
  const weight = options.weight ? ` weight="${options.weight}"` : "";
  const markup = `<span foreground="${options.colour ?? canvas.ink}"${tracking}${weight}>${
    escapeXml(text)
  }</span>`;
  const render = (height?: number) =>
    sharp({
      text: {
        text: markup,
        font: `${font.family} ${size}`,
        fontfile: font.file,
        width,
        height,
        dpi: 72,
        rgba: true,
        wrap: "word-char",
      },
    }).png().toBuffer({ resolveWithObject: true });
  const image = await render();
  // はみ出したときだけ高さ上限を付けて再描画する。
  return options.height && image.info.height > options.height
    ? await render(options.height)
    : image;
}

/** カードの光が集まる位置。対になる光は中心を挟んで反対側に置く。 */
type Position = "top-right" | "center";

/** 中心対称の2つの柔らかい光。アルファを段階化するとグラデーションに縞が出るので連続値で扱う。 */
function field(position: Position): Buffer {
  const [ax, ay] = position === "center" ? [0.5, 0.3] : [0.74, 0.24];
  const [bx, by] = [1 - ax, 1 - ay];
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <defs>
        <radialGradient id="glowA" cx="${ax}" cy="${ay}" r=".52">
          <stop offset="0" stop-color="${light}" stop-opacity=".3" />
          <stop offset=".55" stop-color="${light}" stop-opacity=".08" />
          <stop offset="1" stop-color="${light}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowB" cx="${bx}" cy="${by}" r=".52">
          <stop offset="0" stop-color="${light}" stop-opacity=".17" />
          <stop offset=".55" stop-color="${light}" stop-opacity=".05" />
          <stop offset="1" stop-color="${light}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="shade" cx=".5" cy=".5" r=".78">
          <stop offset=".45" stop-color="${shadow}" stop-opacity="0" />
          <stop offset="1" stop-color="${shadow}" stop-opacity=".5" />
        </radialGradient>
        <filter id="drift" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".0038" numOctaves="3" seed="11" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .5 0 0 0 -.12" />
        </filter>
      </defs>
      <rect width="${canvas.width}" height="${canvas.height}" fill="url(#glowA)" />
      <rect width="${canvas.width}" height="${canvas.height}" fill="url(#glowB)" />
      <rect width="${canvas.width}" height="${canvas.height}" fill="${shadow}" filter="url(#drift)" />
      <rect width="${canvas.width}" height="${canvas.height}" fill="url(#shade)" />
    </svg>`,
  );
}

/** 中間グレー周りの細かい粒。`overlay` で重ねると汚れではなく紙に見える。 */
function paper(): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <filter id="tooth" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="4" seed="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope=".34" intercept=".33" />
          <feFuncG type="linear" slope=".34" intercept=".33" />
          <feFuncB type="linear" slope=".34" intercept=".33" />
          <feFuncA type="linear" slope="0" intercept="1" />
        </feComponentTransfer>
      </filter>
      <rect width="${canvas.width}" height="${canvas.height}" filter="url(#tooth)" />
    </svg>`,
  );
}

function furniture(chipWidth: number, chipTop: number): Buffer {
  const inner = margin + 28;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <rect x="${margin}" y="132" width="${
      canvas.width - margin * 2
    }" height="2" fill="${canvas.ink}" />
      <rect x="${margin}" y="${canvas.height - 108}" width="${
      canvas.width - margin * 2
    }" height="2" fill="${canvas.ink}" />
      <rect x="${margin}" y="168" width="1" height="${
      canvas.height - 312
    }" fill="${canvas.ink}" opacity=".42" />
      <rect x="${inner}" y="${chipTop}" width="${chipWidth}" height="${chipHeight}" fill="${canvas.ink}" />
    </svg>`,
  );
}

function base() {
  return sharp({
    create: { width: canvas.width, height: canvas.height, channels: 4, background: canvas.ground },
  });
}

function pngResponse(data: Uint8Array): Response {
  return new Response(data as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export async function ogPngResponse(
  { title, category, tags = [] }: {
    title: string;
    category: string;
    tags?: readonly string[];
  },
): Promise<Response> {
  const keywords = tags.slice(0, 3).map((tag) => `#${tag}`).join("   ");
  const [label, headline, site, keyline] = await Promise.all([
    textImage(category.toUpperCase(), 19, 520, latin, {
      tracking: trackingFor(19, 0.085),
      colour: canvas.ground,
      weight: 800,
    }),
    textImage(title, 62, canvas.width - margin * 2 - 56, { ...japanese, family: display }, {
      height: 264,
      tracking: trackingFor(62, -0.05),
      weight: 800,
    }),
    textImage("blog.lunacea.jp", 19, 520, latin, { tracking: trackingFor(19, 0.085) }),
    keywords
      ? textImage(keywords, 19, 620, latin, { tracking: trackingFor(19, 0.085) })
      : Promise.resolve(null),
  ]);

  const mark = await wordmark(34);
  const inner = margin + 28;
  const chipWidth = label.info.width + 44;
  const blockHeight = chipHeight + 26 + headline.info.height;
  const chipTop = Math.max(180, Math.round(titleBaseline - blockHeight / 2));
  const titleTop = chipTop + chipHeight + 26;

  const image = await base()
    .composite([
      { input: field("top-right") },
      { input: paper(), blend: "overlay" },
      { input: furniture(chipWidth, chipTop) },
      ...placeWordmark(mark, Math.round((canvas.width - mark.width) / 2), 62),
      {
        input: label.data,
        left: inner + 22,
        top: chipTop + Math.round((chipHeight - label.info.height) / 2),
      },
      { input: headline.data, left: inner, top: titleTop },
      { input: site.data, left: inner, top: canvas.height - 74 },
      ...(keyline
        ? [{
          input: keyline.data,
          left: canvas.width - margin - keyline.info.width,
          top: canvas.height - 74,
        }]
        : []),
    ])
    .png()
    .toBuffer();

  return pngResponse(new Uint8Array(image));
}

/** 題字と同じ組み方（SemiExpanded・strong・em 指定の字間）。どのサイズでも月との関係が保たれる。 */
async function wordmark(size: number) {
  const face = { file: latin.file, family: masthead };
  const tracking = trackingFor(size, -0.055);
  const [left, middle, right] = await Promise.all([
    textImage("LUNA", size, 2400, face, { tracking, weight: 800 }),
    textImage("C", size, 800, face, { tracking, weight: 800 }),
    textImage("EA", size, 1600, face, { tracking, weight: 800 }),
  ]);
  // Pango はキャップの上にレディングを残すため、実際のキャップ矩形を測ってから配置する。
  const caps = await sharp(left.data).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  return {
    left,
    middle,
    right,
    width: left.info.width + middle.info.width + right.info.width,
    capHeight: caps.info.height,
    capInset: Math.abs(caps.info.trimOffsetTop ?? 0),
    size,
  };
}

/** 指定位置にキャップ矩形を合わせてワードマークを配置する合成エントリ。 */
function placeWordmark(mark: Awaited<ReturnType<typeof wordmark>>, x: number, capTop: number) {
  // --masthead-disc-size は 0.92em、キャップハイト約 0.72em に対し 0.07em 持ち上げる。
  const disc = Math.round(mark.capHeight * 1.28);
  return [
    { input: mark.left.data, left: Math.max(0, x), top: capTop - mark.capInset },
    {
      input: mark.right.data,
      left: Math.max(0, x + mark.left.info.width + mark.middle.info.width),
      top: capTop - mark.capInset,
    },
    {
      input: crescent(disc),
      left: x + mark.left.info.width + Math.round((mark.middle.info.width - disc) / 2),
      top: capTop + Math.round((mark.capHeight - disc) / 2) - Math.round(mark.size * 0.07),
    },
  ];
}

/** テーマグリフの三日月を題字が必要とするサイズで描く。 */
function crescent(size: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.624 5.1 13.276 13.276">
      <path d="M14.9 13.65A6.8 6.8 0 0 1 6.35 5.1 6.8 6.8 0 1 0 14.9 13.65Z" fill="${canvas.ink}" />
    </svg>`,
  );
}

/** ホームの名刺を印刷比率で描く。 */
async function businessCard(width: number) {
  const height = Math.round((width * 55) / 91);
  const padding = 40;
  const media = 76;
  const [portrait, name, role] = await Promise.all([
    readFile(portraitPath),
    textImage("LUNACEA", 34, width, latin, { tracking: trackingFor(34, -0.045), weight: 800 }),
    textImage("UI / UX DESIGN — WEB ENGINEERING", 15, width, latin, {
      tracking: trackingFor(15, 0.085),
    }),
  ]);
  const uri = `data:image/png;base64,${Buffer.from(portrait).toString("base64")}`;
  const face = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="1" y="1" width="${width - 2}" height="${
      height - 2
    }" rx="14" fill="${surface}" stroke="${canvas.ink}" stroke-opacity=".22" />
      <image x="${padding}" y="${
      Math.round(height * 0.34 - media / 2)
    }" width="${media}" height="${media}" href="${uri}" preserveAspectRatio="xMidYMid meet" />
    </svg>`,
  );
  const textLeft = padding + media + 24;
  const nameTop = Math.round(height * 0.34 - name.info.height / 2);
  return await sharp(face)
    .composite([
      { input: name.data, left: textLeft, top: nameTop },
      { input: role.data, left: textLeft, top: nameTop + name.info.height + 10 },
    ])
    .png()
    .toBuffer();
}

/** サイトカードはホームそのもの。はみ出す題字と、下端から傾いて現れる名刺。 */
export async function ogSiteResponse(): Promise<Response> {
  const trial = await wordmark(160);
  const mark = await wordmark(Math.round((160 * canvas.width * 1.06) / trial.width));
  const capTop = 84;

  const card = await businessCard(560);
  const rotated = await sharp(card)
    .rotate(10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  const cardTop = canvas.height - Math.round(rotated.info.height * 0.66);
  const cropped = await sharp(rotated.data)
    .extract({ left: 0, top: 0, width: rotated.info.width, height: canvas.height - cardTop })
    .png()
    .toBuffer();

  const image = await base()
    .composite([
      { input: field("center") },
      { input: paper(), blend: "overlay" },
      ...placeWordmark(mark, Math.round((canvas.width - mark.width) / 2), capTop),
      { input: cropped, left: Math.round((canvas.width - rotated.info.width) / 2), top: cardTop },
    ])
    .png()
    .toBuffer();

  return pngResponse(new Uint8Array(image));
}
