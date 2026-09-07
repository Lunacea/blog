import sharp from "sharp";

/**
 * Cuts the tab, bookmark and touch icons from the identity mark rather than drawing it again, so
 * the browser chrome carries the same artwork as the business card on Home.
 */
const source = new URL("../static/images/Lunacea-nobg.png", import.meta.url);
const iconRoot = new URL("../static/icons/", import.meta.url);
/** Clients that guess the path instead of reading the document still need this one at the root. */
const legacyIcon = new URL("../static/favicon.ico", import.meta.url);

/** The mark is authored inside a wide transparent square; trimming lets 16px keep its shape. */
const inset = 0.06;
/** iOS composites a touch icon over black, so this one is flattened onto the light canvas. */
const touchBackground = "#f7f7f5";
const transparent = { r: 0, g: 0, b: 0, alpha: 0 } as const;

const trimmed = await sharp(await Deno.readFile(source)).trim().png().toBuffer();

async function square(size: number, background: sharp.Color): Promise<Uint8Array> {
  const mark = await sharp(trimmed)
    .resize({
      width: Math.round(size * (1 - 2 * inset)),
      height: Math.round(size * (1 - 2 * inset)),
      fit: "contain",
      background: transparent,
    })
    .toBuffer();
  return new Uint8Array(
    await sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([{ input: mark, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );
}

/** An ICO is a directory of whole PNGs, which is all any browser still reads it for. */
function ico(entries: Array<{ size: number; png: Uint8Array }>): Uint8Array {
  const headerBytes = 6 + entries.length * 16;
  const file = new Uint8Array(
    headerBytes + entries.reduce((total, entry) => total + entry.png.length, 0),
  );
  const view = new DataView(file.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);
  let offset = headerBytes;
  entries.forEach(({ size, png }, index) => {
    const at = 6 + index * 16;
    file[at] = size;
    file[at + 1] = size;
    view.setUint16(at + 4, 1, true);
    view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, png.length, true);
    view.setUint32(at + 12, offset, true);
    file.set(png, offset);
    offset += png.length;
  });
  return file;
}

await Deno.mkdir(iconRoot, { recursive: true });
const [small, tab, large] = await Promise.all([
  square(16, transparent),
  square(32, transparent),
  square(192, transparent),
]);
await Promise.all([
  Deno.writeFile(new URL("favicon-32.png", iconRoot), tab),
  Deno.writeFile(new URL("favicon-192.png", iconRoot), large),
  Deno.writeFile(new URL("apple-touch-icon.png", iconRoot), await square(180, touchBackground)),
  Deno.writeFile(legacyIcon, ico([{ size: 16, png: small }, { size: 32, png: tab }])),
]);
console.log("Generated favicon.ico and 3 icon sizes from the identity mark.");
