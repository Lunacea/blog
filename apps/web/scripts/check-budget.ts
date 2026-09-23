type ManifestEntry = {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
};

const client = new URL("../.svelte-kit/output/client/", import.meta.url);
const manifest = JSON.parse(
  await Deno.readTextFile(new URL(".vite/manifest.json", client)),
) as Record<string, ManifestEntry>;

const generatedNodes = new URL("../.svelte-kit/generated/client-optimized/nodes/", import.meta.url);

/** 生成物はリビルドをまたいで残るため、一度全件集めてから現在のマニフェストに絞る。 */
async function nodeKeysFor(routeFile: string): Promise<string[]> {
  const keys: string[] = [];
  for await (const entry of Deno.readDir(generatedNodes)) {
    if (!entry.isFile || !entry.name.endsWith(".js")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, generatedNodes));
    if (!source.includes(`/${routeFile}"`)) continue;
    const key = `.svelte-kit/generated/client-optimized/nodes/${entry.name}`;
    if (manifest[key]) keys.push(key);
  }
  if (!keys.length) throw new Error(`Unable to resolve generated client node for ${routeFile}.`);
  return keys;
}

const articleDetailNodeKeys = await nodeKeysFor("src/routes/articles/[slug]/+page.svelte");
const articleDetailNodeKey = articleDetailNodeKeys[0];

const roots = [
  "../../node_modules/.deno/@sveltejs+kit@2.69.2/node_modules/@sveltejs/kit/src/runtime/client/entry.js",
  ".svelte-kit/generated/client-optimized/app.js",
  ".svelte-kit/generated/client-optimized/nodes/0.js",
  articleDetailNodeKey,
];
const files = new Set<string>();

function collect(key: string): void {
  const entry = manifest[key];
  if (!entry || files.has(entry.file)) return;
  files.add(entry.file);
  for (const imported of entry.imports ?? []) collect(imported);
}

for (const root of roots) collect(root);

const initialKeys = Object.entries(manifest)
  .filter(([, entry]) => files.has(entry.file))
  .map(([key]) => key);
const forbiddenInitialDependencies = [
  { label: "Mermaid", pattern: /(?:^|\/)mermaid(?:@|\/|$)|@mermaid-js/u },
  { label: "Storybook", pattern: /(?:^|\/)@?storybook(?:@|\/|$)/u },
  { label: "Threlte", pattern: /(?:^|\/)@threlte(?:@|\/|$)/u },
  { label: "Three.js", pattern: /(?:^|\/)three(?:@|\/|$)/u },
];

for (const dependency of forbiddenInitialDependencies) {
  const match = initialKeys.find((key) => dependency.pattern.test(key));
  if (match) {
    throw new Error(`${dependency.label} entered the article initial graph through ${match}.`);
  }
}

function collectKeys(key: string, keys: Set<string>): void {
  const entry = manifest[key];
  if (!entry || keys.has(key)) return;
  keys.add(key);
  for (const imported of entry.imports ?? []) collectKeys(imported, keys);
}

for (const key of Object.keys(manifest)) {
  const match = key.match(/generated\/client-optimized\/nodes\/(\d+)\.js$/u);
  if (!match) continue;
  const routeKeys = new Set<string>();
  collectKeys(key, routeKeys);
  for (const dependency of forbiddenInitialDependencies.slice(2)) {
    const leaked = [...routeKeys].find((routeKey) => dependency.pattern.test(routeKey));
    if (leaked) {
      throw new Error(`${dependency.label} entered route ${key} through ${leaked}.`);
    }
  }
}

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

console.log(
  `Article initial JavaScript: ${(gzipBytes / 1024).toFixed(1)} KiB gzip (${files.size} files).`,
);

const webglFiles = new Set<string>();
function collectWebgl(key: string): void {
  const entry = manifest[key];
  if (!entry || webglFiles.has(entry.file)) return;
  webglFiles.add(entry.file);
  for (const imported of entry.imports ?? []) collectWebgl(imported);
}
const webglRoot = "src/lib/visuals/editorial-light.ts";
if (!manifest[webglRoot]) {
  throw new Error("Weather background WebGL graph is missing from the manifest.");
}
collectWebgl(webglRoot);
let webglGzipBytes = 0;
for (const file of webglFiles) {
  if (!file.endsWith(".js")) continue;
  const bytes = await Deno.readFile(new URL(file, client));
  const compressed = new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  );
  webglGzipBytes += (await compressed.arrayBuffer()).byteLength;
}
const webglLimit = 230 * 1024;
if (webglGzipBytes > webglLimit) {
  throw new Error(
    `Weather background WebGL graph is ${webglGzipBytes} gzip bytes; limit is ${webglLimit}.`,
  );
}
console.log(
  `Weather background WebGL JavaScript: ${
    (webglGzipBytes / 1024).toFixed(1)
  } KiB gzip (${webglFiles.size} files).`,
);
