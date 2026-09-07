/**
 * Routes the prerendered files the Deno adapter leaves behind.
 *
 * `@deno/svelte-adapter` builds `deploy.json`'s `staticFiles` from `prerendered.pages` and the
 * `static/` directory alone, so output prerendered from `+server.ts` endpoints — the feeds, the
 * sitemap, robots and every OG image — is written into the deployment but never given a URL, and
 * answers 404 in production. Endpoints have no server handler once prerendered, so nothing else
 * picks them up. This maps each remaining file in the adapter's static output to its own path.
 *
 * Remove this step once the adapter routes `prerendered.assets` itself; it then reports nothing.
 */
const output = new URL("../.deno-deploy/", import.meta.url);
const configPath = new URL("deploy.json", output);

let config: { staticFiles: Array<{ source: string; destination: string }> };
try {
  config = JSON.parse(await Deno.readTextFile(configPath));
} catch (cause) {
  throw new Error("No .deno-deploy/deploy.json: run the build before linking assets.", { cause });
}

async function* walk(directory: URL, prefix = ""): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(directory)) {
    if (entry.isDirectory) {
      yield* walk(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`);
    } else if (entry.isFile) yield `${prefix}${entry.name}`;
  }
}

const routed = new Set(config.staticFiles.map((entry) => entry.source));
const served = new Set(config.staticFiles.map((entry) => entry.destination));
const linked: string[] = [];

for await (const relative of walk(new URL("static/", output))) {
  // The immutable bundle already travels under one wildcard entry.
  if (relative.startsWith("_app/immutable/")) continue;
  const source = `/${relative.split("/").map(encodeURIComponent).join("/")}`;
  const destination = `.deno-deploy/static/${relative}`;
  // A prerendered page is already reachable at its route, not at its file name.
  if (routed.has(source) || served.has(destination)) continue;
  config.staticFiles.push({ source, destination });
  linked.push(source);
}

if (linked.length > 0) {
  await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}
console.log(
  linked.length > 0
    ? `Routed ${linked.length} prerendered assets: ${linked.sort().join(", ")}`
    : "No unrouted prerendered assets.",
);
