export type CompositionBlock = {
  kind: "text" | "technical" | "media";
  start: number;
  end: number;
  units: number;
  characters: number;
};
export type CompositionSection = { id: string; start: number; end: number; units: number };
export type ArticleComposition = {
  estimatedMinutes: number;
  textCharacters: number;
  paperLayers: number;
  blocks: CompositionBlock[];
  sections: CompositionSection[];
};

/** One sheet stands for one reading minute, so the stack reads as time rather than file size. */
export function paperLayerCount(estimatedMinutes: number): number {
  return Math.min(5, Math.max(1, Math.ceil(estimatedMinutes)));
}

function plain(value: string): string {
  return value.replace(/!\[[^\]]*\]\([^)]*\)/gu, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/https?:\/\/[^\s<>]+/gu, "")
    .replace(/<[^>]*>/gu, "").replace(/[*_`#>|~]/gu, "").replace(/\s/gu, "");
}

export function analyzeArticleComposition(source: string): ArticleComposition {
  const content = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/u, "")
    .replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/giu, "");
  const blocks: CompositionBlock[] = [];
  const sections: CompositionSection[] = [];
  const slugs = new Map<string, number>();
  let total = 0;
  let textCharacters = 0;
  const commit = (kind: CompositionBlock["kind"], units: number, characters = 0) => {
    if (!units) return;
    blocks.push({ kind, start: total, end: total + units, units, characters });
    total += units;
    textCharacters += characters;
  };
  const text = (value: string) => {
    const characters = [...plain(value)].length;
    commit("text", characters, characters);
  };
  // Process embedded objects in source order, rather than aggregating by kind.
  const paragraph = (value: string) => {
    const objects =
      /!\[[^\]]*\]\([^)]*\)|<(?:img|figure|picture|MediaSlot|ResponsiveImage|LinkCard)\b[^>]*>|\$[^$\n]+\$/giu;
    let cursor = 0;
    for (const match of value.matchAll(objects)) {
      text(value.slice(cursor, match.index));
      commit(match[0].startsWith("$") ? "technical" : "media", match[0].startsWith("$") ? 48 : 180);
      cursor = match.index! + match[0].length;
    }
    text(value.slice(cursor));
  };
  let buffer: string[] = [];
  const flush = () => {
    paragraph(buffer.join(" "));
    buffer = [];
  };
  let fence: { marker: string; kind: "technical" | "media"; lines: number } | undefined;
  let math: string[] | undefined;
  for (const line of content.split(/\r?\n/u)) {
    if (fence) {
      if (line.trim().startsWith(fence.marker)) {
        commit(fence.kind, fence.kind === "media" ? 220 : Math.max(48, fence.lines * 22));
        fence = undefined;
      } else fence.lines++;
      continue;
    }
    if (math) {
      if (line.trim().endsWith("$$")) {
        commit("technical", Math.max(48, math.length * 22));
        math = undefined;
      } else math.push(line);
      continue;
    }
    const opening = /^\s*(`{3,}|~{3,})(\S*)/u.exec(line);
    if (opening) {
      flush();
      fence = {
        marker: opening[1],
        kind: opening[2] === "mermaid" ? "media" : "technical",
        lines: 0,
      };
      continue;
    }
    if (line.trim().startsWith("$$")) {
      flush();
      if (line.trim().length > 4 && line.trim().endsWith("$$")) commit("technical", 48);
      else math = [];
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
    if (heading) {
      flush();
      const base = heading[2].replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1").replace(/[*_`]/gu, "").trim()
        .toLocaleLowerCase("ja").replace(/[^\p{Letter}\p{Number}\s_-]/gu, "").trim().replace(
          /\s+/gu,
          "-",
        ) || "section";
      const count = slugs.get(base) ?? 0;
      slugs.set(base, count + 1);
      if (heading[1].length === 2 || heading[1].length === 3) {
        sections.push({ id: count ? `${base}-${count}` : base, start: total, end: 0, units: 0 });
      }
      text(heading[2]);
    } else if (!line.trim()) flush();
    else buffer.push(line);
  }
  flush();
  if (fence) commit(fence.kind, Math.max(48, fence.lines * 22));
  if (math) commit("technical", Math.max(48, math.length * 22));
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    section.end = sections[index + 1]?.start ?? total;
    section.units = section.end - section.start;
  }
  for (const item of [...blocks, ...sections]) {
    item.start = total ? item.start / total : 0;
    item.end = total ? item.end / total : 0;
  }
  const estimatedMinutes = Math.ceil(total / 480);
  return {
    estimatedMinutes,
    textCharacters,
    paperLayers: paperLayerCount(estimatedMinutes),
    blocks,
    sections,
  };
}
