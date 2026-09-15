/**
 * Deno アダプタが取りこぼす事前描画ファイルを配線する。
 *
 * `@deno/svelte-adapter` は `deploy.json` の `staticFiles` を `prerendered.pages` と `static/`
 * だけから作るため、`+server.ts` から事前描画された出力（フィード・サイトマップ・robots・OG画像）
 * はデプロイに含まれても URL を持たず本番で 404 になる。
 *
 * アダプタが `prerendered.assets` を自分で配線するようになったらこの手順は不要。
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
  if (relative.startsWith("_app/immutable/")) continue;
  const source = `/${relative.split("/").map(encodeURIComponent).join("/")}`;
  const destination = `.deno-deploy/static/${relative}`;
  // 事前描画済みページはファイル名ではなくルートで到達できる。
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
