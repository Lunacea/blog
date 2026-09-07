const generated = new URL("../.generated/fonts/", import.meta.url);
const manifest = JSON.parse(
  await Deno.readTextFile(new URL("manifest.json", generated)),
) as { fonts: Array<{ key: string; output: string; bytes: number; preload: boolean }> };

for (const font of manifest.fonts) await Deno.stat(new URL(font.output, generated));
const preloadBytes = manifest.fonts.filter((font) => font.preload)
  .reduce((sum, font) => sum + font.bytes, 0);
const routeBytes = manifest.fonts.reduce((sum, font) => sum + font.bytes, 0);
if (preloadBytes > 350 * 1024) throw new Error(`Font preloads exceed 350 KiB: ${preloadBytes}`);
if (routeBytes > 500 * 1024) throw new Error(`Route fonts exceed 500 KiB: ${routeBytes}`);
console.log(
  `Font budgets: preload ${(preloadBytes / 1024).toFixed(1)} KiB; all route subsets ${
    (routeBytes / 1024).toFixed(1)
  } KiB.`,
);
