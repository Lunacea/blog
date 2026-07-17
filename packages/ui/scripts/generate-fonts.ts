import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

const root = new URL("../../../", import.meta.url);
const output = new URL("../.generated/fonts/", import.meta.url);
const source = new URL("../fonts/source/", import.meta.url);

type SubsetFont = (
  original: Uint8Array,
  text: string,
  options: { targetFormat: "woff2" },
) => Promise<Uint8Array>;

const subsetFont = (await import("npm:subset-font@2.5.0")).default as SubsetFont;

async function walk(directory: URL, extensions: Set<string>): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const url = new URL(entry.name + (entry.isDirectory ? "/" : ""), directory);
    if (entry.isDirectory) files.push(...await walk(url, extensions));
    else if (extensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) files.push(url);
  }
  return files;
}

function displayText(value: string): string {
  return value
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/gu, " ")
    .replace(/`[^`\n]+`/gu, " ")
    .replace(/https?:\/\/[^\s"')>]+/gu, " ")
    .replace(/<script[\s\S]*?<\/script>/gu, " ")
    .replace(/<style[\s\S]*?<\/style>/gu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\{[#/:@]?[\s\S]*?\}/gu, " ")
    .replace(/\s+/gu, " ");
}

function uniqueCharacters(value: string): string {
  return [...new Set(value)].sort().join("");
}

function stringLiterals(value: string): string {
  return [...value.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/gu)]
    .map((match) => match[2] ?? "")
    .filter((text) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\s]/u.test(text))
    .join(" ");
}

function codeText(value: string): string {
  const fenced = [...value.matchAll(/```[^\n]*\n([\s\S]*?)```|~~~[^\n]*\n([\s\S]*?)~~~/gu)]
    .map((match) => match[1] ?? match[2] ?? "");
  const inline = [...value.matchAll(/`([^`\n]+)`/gu)].map((match) => match[1] ?? "");
  return [...fenced, ...inline].join(" ").replace(/https?:\/\/\S+/gu, " ");
}

function editorialText(value: string): string {
  const markdown = [...value.matchAll(/^(?:#{1,2}|>)\s+(.+)$/gmu)].map((match) => match[1] ?? "");
  const markup = [
    ...value.matchAll(/<(?:h1|h2|blockquote)\b[^>]*>([\s\S]*?)<\/(?:h1|h2|blockquote)>/gu),
  ]
    .map((match) => displayText(match[1] ?? ""));
  return [...markdown, ...markup].join(" ");
}

async function corpora(): Promise<{ full: string; editorial: string; code: string }> {
  const roots = [
    new URL("packages/content/entries/", root),
    new URL("packages/ui/src/", root),
    new URL("apps/web/src/", root),
  ];
  const files = (await Promise.all(
    roots.map((directory) => walk(directory, new Set([".svx", ".svelte", ".ts"]))),
  )).flat();
  files.push(new URL("packages/config/mod.ts", root));
  const sources = await Promise.all(files.map((file) => Deno.readTextFile(file)));
  const full = sources.map((text) => displayText(text) + " " + stringLiterals(text)).join("\n");
  const editorial = sources.map(editorialText).join("\n");
  const code = sources.map(codeText).join("\n");
  return {
    full: uniqueCharacters(
      full +
        " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz、。・！？「」『』（）—…/:#&",
    ),
    editorial: uniqueCharacters(
      editorial +
        " Quiet structures growing records Lunacea 静かな記録技術は内容を残すために使う、。！？「」—…",
    ),
    code: uniqueCharacters(
      code +
        " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}[]()<>+-=*/._:#@$%&|!?;,'\"\\",
    ),
  };
}

const fonts = [
  {
    family: "Manrope",
    key: "manrope",
    weight: "200 800",
    file: "manrope/Manrope[wght].ttf",
    role: "latin",
    preload: true,
  },
  {
    family: "Zen Kaku Gothic New",
    key: "zen-400",
    weight: 400,
    file: "zen-kaku-gothic-new/ZenKakuGothicNew-Regular.ttf",
    role: "all",
    preload: true,
  },
  {
    family: "Zen Kaku Gothic New",
    key: "zen-500",
    weight: 500,
    file: "zen-kaku-gothic-new/ZenKakuGothicNew-Medium.ttf",
    role: "all",
    preload: false,
  },
  {
    family: "Zen Kaku Gothic New",
    key: "zen-700",
    weight: 700,
    file: "zen-kaku-gothic-new/ZenKakuGothicNew-Bold.ttf",
    role: "all",
    preload: false,
  },
  {
    family: "Newsreader",
    key: "newsreader",
    weight: "200 800",
    file: "newsreader/Newsreader[opsz,wght].ttf",
    role: "editorial-latin",
    preload: false,
  },
  {
    family: "Hina Mincho",
    key: "hina-400",
    weight: 400,
    file: "hina-mincho/HinaMincho-Regular.ttf",
    role: "editorial",
    preload: true,
  },
  {
    family: "DotGothic16",
    key: "dot-400",
    weight: 400,
    file: "dot-gothic-16/DotGothic16-Regular.ttf",
    role: "accent",
    preload: false,
  },
  {
    family: "Fira Code",
    key: "fira-code",
    weight: "300 700",
    file: "fira-code/FiraCode[wght].ttf",
    role: "code",
    preload: false,
  },
] as const;

export async function generateFontSubsets(): Promise<void> {
  const { full: fullCorpus, editorial: editorialCorpus, code: codeCorpus } = await corpora();
  const accentCorpus = uniqueCharacters(
    "Lunacea Archive System quiet Sample Published 0123456789/:.-",
  );
  await Deno.mkdir(output, { recursive: true });

  const generated: Array<typeof fonts[number] & { output: string; bytes: number }> = [];
  for (const font of fonts) {
    const input = await Deno.readFile(new URL(font.file, source));
    const text = font.role === "accent"
      ? accentCorpus
      : font.role === "editorial" || font.role === "editorial-latin"
      ? editorialCorpus
      : font.role === "code"
      ? codeCorpus
      : fullCorpus;
    const result = await subsetFont(Buffer.from(input), text, { targetFormat: "woff2" });
    const hash = createHash("sha256").update(result).digest("hex").slice(0, 12);
    const filename = `${font.key}.${hash}.woff2`;
    await Deno.writeFile(new URL(filename, output), result);
    generated.push({ ...font, output: filename, bytes: result.byteLength });
  }

  const faces = generated.map((font) =>
    `@font-face {
  font-family: "${font.family}";
  src: url("./${font.output}") format("woff2");
  font-style: normal;
  font-weight: ${font.weight};
  font-display: swap;
}`
  ).join("\n\n");
  const fallbacks = `@font-face {
  font-family: "Zen Kaku Gothic New Fallback";
  src: local("Hiragino Sans"), local("Yu Gothic UI"), local("Yu Gothic");
  size-adjust: 100%;
  ascent-override: 92%;
  descent-override: 24%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Hina Mincho Fallback";
  src: local("Yu Mincho"), local("Hiragino Mincho ProN");
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Manrope Fallback";
  src: local("Arial"), local("Helvetica");
  size-adjust: 101%;
  ascent-override: 94%;
  descent-override: 24%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Newsreader Fallback";
  src: local("Georgia"), local("Times New Roman");
  size-adjust: 100%;
  ascent-override: 91%;
  descent-override: 23%;
  line-gap-override: 0%;
}`;
  await Deno.writeTextFile(new URL("fonts.css", output), `${faces}\n\n${fallbacks}\n`);

  const preloadFonts = generated.filter((font) => font.preload);
  const imports = preloadFonts.map((font, index) =>
    `import font${index} from "./${font.output}?url";`
  ).join("\n");
  const references = preloadFonts.map((_, index) => `font${index}`).join(", ");
  await Deno.writeTextFile(
    new URL("preloads.ts", output),
    `${imports}\nexport const fontPreloads = [${references}];\n`,
  );
  await Deno.writeTextFile(
    new URL("manifest.json", output),
    JSON.stringify(
      {
        corpusHash: createHash("sha256").update(fullCorpus).digest("hex"),
        fonts: generated,
      },
      null,
      2,
    ) + "\n",
  );
  const currentFiles = new Set(generated.map((font) => font.output));
  for await (const entry of Deno.readDir(output)) {
    if (entry.isFile && entry.name.endsWith(".woff2") && !currentFiles.has(entry.name)) {
      await Deno.remove(new URL(entry.name, output));
    }
  }
  console.log(
    `Generated ${generated.length} font subsets (${
      generated.reduce((sum, font) => sum + font.bytes, 0)
    } bytes).`,
  );
}

if (import.meta.main) await generateFontSubsets();
