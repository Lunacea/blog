type ManifestEntry = {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
};

const client = new URL("../.svelte-kit/output/client/", import.meta.url);
const manifest = JSON.parse(
  await Deno.readTextFile(new URL(".vite/manifest.json", client)),
) as Record<string, ManifestEntry>;

const roots = [
  "../../node_modules/.deno/@sveltejs+kit@2.69.2/node_modules/@sveltejs/kit/src/runtime/client/entry.js",
  ".svelte-kit/generated/client-optimized/app.js",
  ".svelte-kit/generated/client-optimized/nodes/0.js",
  ".svelte-kit/generated/client-optimized/nodes/12.js",
];
const files = new Set<string>();

function collect(key: string): void {
  const entry = manifest[key];
  if (!entry || files.has(entry.file)) return;
  files.add(entry.file);
  for (const imported of entry.imports ?? []) collect(imported);
}

for (const root of roots) collect(root);

let gzipBytes = 0;
for (const file of files) {
  const bytes = await Deno.readFile(new URL(file, client));
  const compressed = new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  );
  gzipBytes += (await compressed.arrayBuffer()).byteLength;
}

const limit = 150 * 1024;
if (gzipBytes > limit) {
  throw new Error(`Article initial JavaScript is ${gzipBytes} gzip bytes; limit is ${limit}.`);
}

const detail = manifest[".svelte-kit/generated/client-optimized/nodes/12.js"];
if (detail?.dynamicImports?.some((path) => path.includes("HeroScene"))) {
  throw new Error("Article route must not import the WebGL hero.");
}

console.log(
  `Article initial JavaScript: ${(gzipBytes / 1024).toFixed(1)} KiB gzip (${files.size} files).`,
);
