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
/** The same order the site's --font-sans uses, so Latin lands on Archivo and Japanese on Zen. */
const display = "Archivo, Zen Kaku Gothic New Bold";
/** Pango's SemiExpanded selects wdth 112 on the variable face — the masthead's own width. */
const masthead = "Archivo SemiExpanded";

/** Pango counts letter spacing in 1024ths of a point, while the site declares it in em. */
function trackingFor(size: number, em: number): number {
  return Math.round(em * size * 1024);
}

/**
 * `fontfile` registers one file per render, so both faces are loaded once up front. Without this
 * the family list silently falls back to whichever file the first render happened to load.
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
 * Share cards are a fixed 1200x630 export, so their palette and geometry are declared in absolute
 * units rather than as responsive tokens. They are always the dark theme: a card is read against
 * someone else's timeline, and ink on near-black is what carries there.
 */
// design-literal: mirrors the dark theme's --color-background and --color-foreground.
const canvas = { width: 1200, height: 630, ground: "#111111", ink: "#eeeeec" };
// design-literal: the light and shadow primaries the field is built from.
const light = "#ffffff";
// design-literal: the light and shadow primaries the field is built from.
const shadow = "#000000";
// design-literal: the card surface in the dark theme, mirroring --color-surface.
const surface = "#1b1b1b";
const margin = 72;
const chipHeight = 46;
// The midpoint between the opening and closing rules.
const titleBaseline = 326;

export function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Pango measures and wraps actual local-font glyphs, including Japanese and unbroken words. */
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
  // Only re-render with a height cap when the natural block overflows its slot.
  return options.height && image.info.height > options.height
    ? await render(options.height)
    : image;
}

/** Where a card's light gathers; its partner sits opposite through the centre. */
type Position = "top-right" | "center";

/**
 * Two soft lights placed point-symmetrically about the centre, shaped by one low-frequency
 * turbulence and closed by a vignette. Nothing is posterised: stepped alpha was what banded the
 * gradient into layers.
 */
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

/** A fine, even tooth around mid-grey: laid over with `overlay` it reads as paper, not as dirt. */
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

/** The card's lines: two solid rules and the hairline the content is set against. */
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
  // The chip and the headline are centred together between the two rules.
  const blockHeight = chipHeight + 26 + headline.info.height;
  const chipTop = Math.max(180, Math.round(titleBaseline - blockHeight / 2));
  const titleTop = chipTop + chipHeight + 26;

  const image = await base()
    .composite([
      { input: field("top-right") },
      { input: paper(), blend: "overlay" },
      { input: furniture(chipWidth, chipTop) },
      // The wordmark is the site card's, set small and centred over the rule.
      ...placeWordmark(mark, Math.round((canvas.width - mark.width) / 2), 62),
      {
        input: label.data,
        left: inner + 22,
        top: chipTop + Math.round((chipHeight - label.info.height) / 2),
      },
      { input: headline.data, left: inner, top: titleTop },
      { input: site.data, left: inner, top: canvas.height - 74 },
      // Tags close the card opposite the address, the way a catalog row closes.
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

/**
 * LUNA + the moon + EA, set exactly as the masthead sets it: the SemiExpanded width axis, the
 * strong weight and the tracking the page declares in em. Both cards use this, so the wordmark
 * and the moon hold the same relationship at any size.
 */
async function wordmark(size: number) {
  const face = { file: latin.file, family: masthead };
  const tracking = trackingFor(size, -0.055);
  const [left, middle, right] = await Promise.all([
    textImage("LUNA", size, 2400, face, { tracking, weight: 800 }),
    textImage("C", size, 800, face, { tracking, weight: 800 }),
    textImage("EA", size, 1600, face, { tracking, weight: 800 }),
  ]);
  // Pango leaves leading above the caps, so the real cap box is measured before positioning.
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

/** Composite entries that place a wordmark with its cap box at the given point. */
function placeWordmark(mark: Awaited<ReturnType<typeof wordmark>>, x: number, capTop: number) {
  // --masthead-disc-size is 0.92em against a cap height of roughly 0.72em, lifted 0.07em.
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

/** The crescent from the site's own theme glyph, drawn at whatever size the masthead needs. */
function crescent(size: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.624 5.1 13.276 13.276">
      <path d="M14.9 13.65A6.8 6.8 0 0 1 6.35 5.1 6.8 6.8 0 1 0 14.9 13.65Z" fill="${canvas.ink}" />
    </svg>`,
  );
}

/** The business card from Home, drawn at its printed proportion. */
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

/**
 * The site card is Home itself: the bleeding masthead with the moon in place of the C, and the
 * business card resting at an angle as it rises out of the bottom edge.
 */
export async function ogSiteResponse(): Promise<Response> {
  const trial = await wordmark(160);
  // The masthead bleeds past both edges the way it does on Home.
  const mark = await wordmark(Math.round((160 * canvas.width * 1.06) / trial.width));
  const capTop = 84;

  const card = await businessCard(560);
  const rotated = await sharp(card)
    .rotate(10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  // Only the upper part clears the bottom edge, as though the card were set down there.
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
