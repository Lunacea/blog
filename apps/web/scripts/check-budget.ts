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
async function nodeKeyFor(routeFile: string): Promise<string> {
  for await (const entry of Deno.readDir(generatedNodes)) {
    if (!entry.isFile || !entry.name.endsWith(".js")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, generatedNodes));
    if (source.includes(`/${routeFile}\"`)) {
      return `.svelte-kit/generated/client-optimized/nodes/${entry.name}`;
    }
  }
  throw new Error(`Unable to resolve generated client node for ${routeFile}.`);
}

const homeNodeKey = await nodeKeyFor("src/routes/+page.svelte");
const articleDetailNodeKey = await nodeKeyFor("src/routes/articles/[slug]/+page.svelte");

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
  if (!match || key === homeNodeKey) continue;
  const routeKeys = new Set<string>();
  collectKeys(key, routeKeys);
  for (const dependency of forbiddenInitialDependencies.slice(2)) {
    const leaked = [...routeKeys].find((routeKey) => dependency.pattern.test(routeKey));
    if (leaked) {
      throw new Error(`${dependency.label} entered non-Home route ${key} through ${leaked}.`);
    }
  }
  const heroImport = [...routeKeys].some((routeKey) =>
    manifest[routeKey]?.dynamicImports?.some((path) => path.includes("HeroScene"))
  );
  if (heroImport) throw new Error(`Home Hero entered non-Home route ${key}.`);
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
if (detail?.dynamicImports?.some((path) => path.includes("HeroScene"))) {
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
collectWebgl("../../packages/ui/src/visuals/HeroScene.svelte");
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
