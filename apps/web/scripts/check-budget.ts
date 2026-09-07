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

/**
 * Stale generated nodes survive rebuilds, so every match is collected and then narrowed to the
 * ones the current manifest actually knows about.
 */
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

const homeNodeKeys = await nodeKeysFor("src/routes/+page.svelte");
const catalogNodeKeys = await nodeKeysFor("src/routes/articles/+page.svelte");
const articleDetailNodeKeys = await nodeKeysFor("src/routes/articles/[slug]/+page.svelte");
/** Routes allowed to mount the animated field: Home and the article catalog. */
const fieldRoutes = new Set([...homeNodeKeys, ...catalogNodeKeys]);
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
  if (!match || fieldRoutes.has(key)) continue;
  const routeKeys = new Set<string>();
  collectKeys(key, routeKeys);
  for (const dependency of forbiddenInitialDependencies.slice(2)) {
    const leaked = [...routeKeys].find((routeKey) => dependency.pattern.test(routeKey));
    if (leaked) {
      throw new Error(`${dependency.label} entered non-Home route ${key} through ${leaked}.`);
    }
  }
  const heroImport = [...routeKeys].some((routeKey) =>
    manifest[routeKey]?.dynamicImports?.some((path) => /HeroScene|editorial-light/.test(path))
  );
  if (heroImport) {
    const via = [...routeKeys].filter((routeKey) =>
      manifest[routeKey]?.dynamicImports?.some((path) => /HeroScene|editorial-light/.test(path))
    );
    throw new Error(`The editorial light entered reading route ${key} via ${via.join(", ")}.`);
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

const detail = manifest[articleDetailNodeKey];
if (detail?.dynamicImports?.some((path) => /HeroScene|editorial-light/.test(path))) {
  throw new Error("Article route must not import the WebGL hero.");
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
const webglRoot = "../../packages/ui/src/visuals/editorial-light.ts";
if (!manifest[webglRoot]) {
  throw new Error("Home editorial WebGL graph is missing from the manifest.");
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
  throw new Error(`Home WebGL graph is ${webglGzipBytes} gzip bytes; limit is ${webglLimit}.`);
}
console.log(
  `Home WebGL JavaScript: ${
    (webglGzipBytes / 1024).toFixed(1)
  } KiB gzip (${webglFiles.size} files).`,
);
