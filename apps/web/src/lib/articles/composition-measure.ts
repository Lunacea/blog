import type { ArticleCompositionVisual } from "./article-composition-types.ts";

/**
 * 本文の構成（どこに文章・技術的なブロック・図版があり、各節がどこからどこまでか）を描画後の
 * 位置から測る。ビルド時の推定値は文字数からの近似なので、実際の組版に合わせて置き換える。
 */

type Kind = ArticleCompositionVisual["blocks"][number]["kind"];

function kindOf(element: Element): Kind {
  if (element.matches("figure, picture, img, .mermaid-diagram, .link-card")) return "media";
  if (
    element.matches("pre, table, .code-block, .katex-display") ||
    element.querySelector(".katex-display")
  ) return "technical";
  return "text";
}

export function measureComposition(
  prose: HTMLElement,
  headings: readonly HTMLElement[],
  estimate?: ArticleCompositionVisual,
): ArticleCompositionVisual | undefined {
  const bounds = prose.getBoundingClientRect();
  const total = bounds.height;
  if (!total) return undefined;
  const offset = (element: Element) => element.getBoundingClientRect().top - bounds.top;
  const share = (start: number, end: number) => ({
    units: Math.max(0, end - start),
    start: Math.min(1, Math.max(0, start / total)),
    end: Math.min(1, Math.max(0, end / total)),
  });

  // 同じ種類が続くブロックは1つにまとめる。段落ごとに刻むと地図が細かすぎて読めない。
  const runs: Array<{ kind: Kind; start: number; end: number; characters: number }> = [];
  for (const child of prose.children as HTMLCollectionOf<HTMLElement>) {
    const height = child.getBoundingClientRect().height;
    if (child.hidden || height <= 0) continue;
    const kind = kindOf(child);
    const start = offset(child);
    const characters = child.textContent?.length ?? 0;
    const previous = runs.at(-1);
    if (previous?.kind === kind) {
      previous.end = start + height;
      previous.characters += characters;
    } else {
      runs.push({ kind, start, end: start + height, characters });
    }
  }

  return {
    estimatedMinutes: estimate?.estimatedMinutes ?? 0,
    textCharacters: estimate?.textCharacters ?? 0,
    paperLayers: estimate?.paperLayers ?? 1,
    blocks: runs.map((run) => ({
      kind: run.kind,
      characters: run.characters,
      ...share(run.start, run.end),
    })),
    sections: headings.map((heading, index) => {
      const next = headings[index + 1];
      return { id: heading.id, ...share(offset(heading), next ? offset(next) : total) };
    }),
  };
}

/** 本文の大きさが変わるたびに測り直す。フォントや図の読み込みで組版は後から動く。 */
export function observeComposition(
  prose: HTMLElement,
  headings: readonly HTMLElement[],
  estimate: ArticleCompositionVisual | undefined,
  onMeasure: (composition: ArticleCompositionVisual) => void,
): () => void {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const measured = measureComposition(prose, headings, estimate);
      if (measured) onMeasure(measured);
    });
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(prose);
  schedule();
  return () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}
