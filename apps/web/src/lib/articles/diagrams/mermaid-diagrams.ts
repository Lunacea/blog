import { type BlockShell, createBlockShell } from "../block-tools.ts";
import { createDiagramDialog } from "./diagram-dialog.ts";
import { type DiagramScheme, mermaidConfig } from "./mermaid-palette.ts";

/**
 * 本文の Mermaid 記述を図にする。図のある記事でだけ動的に読み込まれる。
 *
 * - 各記述を「図」と「ソース」の2ビューを持つブロックにし、拡大表示を付ける。
 * - 表示中のテーマで描いたあと、もう一方のテーマの図を空き時間に描いて控える。テーマの
 *   切り替えでは描き直さず差し替えるだけにする（描画はレイアウトを何度も強制して重い）。
 * - 読者がソースを編集したら、入力が止まってから描き直す。
 */

type Mermaid = typeof import("mermaid").default;
type Rendered = { graph: string; figure: HTMLElement | null };
type Diagram = {
  source: HTMLElement;
  title: string;
  /** 現在のグラフ。読者が編集するまでは元の記述。 */
  graph: string;
  /** 図の置き場所（ブロックの描画ビュー）。 */
  host: HTMLElement;
  figure?: HTMLElement;
  /** テーマごとの描画結果。null は描けなかった記述。`graph` が変わったら使わない。 */
  rendered: Partial<Record<DiagramScheme, Rendered>>;
};

/** Mermaid の initialize はページ全体で1つなので、描画は記事をまたいで直列にする。 */
let queue: Promise<void> = Promise.resolve();
let renderId = 0;
const enqueue = (task: () => Promise<void>) => (queue = queue.catch(() => undefined).then(task));

const currentScheme = (): DiagramScheme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

/** 元幅の9割を下回るとラベルが読めなくなるので、以降は縮小せずスクロールさせる。 */
const legibleShare = 0.9;
/** 入力そのものではなく、入力が止まったことを描き直しの契機にする。 */
const editSettle = 420;

async function draw(mermaid: Mermaid, diagram: Diagram): Promise<HTMLElement | null> {
  try {
    const { svg } = await mermaid.render(`mermaid-${++renderId}`, diagram.graph);
    const figure = document.createElement("figure");
    figure.className = "mermaid-diagram";
    figure.setAttribute("role", "img");
    // 横スクロールするのでキーボードから到達できるようにする。
    figure.tabIndex = 0;
    figure.setAttribute("aria-label", diagram.title);
    figure.innerHTML = svg;
    const drawing = figure.querySelector("svg");
    drawing?.setAttribute("aria-hidden", "true");
    const authored = drawing?.viewBox?.baseVal?.width ?? 0;
    if (authored) {
      figure.style.setProperty(
        "--mermaid-legible-width",
        `${Math.round(authored * legibleShare)}px`,
      );
      figure.style.setProperty("--mermaid-natural-width", `${Math.round(authored)}px`);
    }
    return figure;
  } catch {
    return null;
  }
}

/** 空き時間の仕事。Safari は requestIdleCallback を持たないので、少し待つだけにする。 */
function whenIdle(task: () => void): () => void {
  if ("requestIdleCallback" in globalThis) {
    const id = requestIdleCallback(task, { timeout: 4000 });
    return () => cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(task, 1200);
  return () => clearTimeout(id);
}

export function enhanceDiagrams(
  prose: HTMLElement,
  report: (message: string) => void,
): () => void {
  const sources = [...prose.querySelectorAll<HTMLElement>(".mermaid-source")];
  if (!sources.length) return () => {};
  let disposed = false;
  let generation = 0;
  let cancelSpare: (() => void) | undefined;
  let editTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const dialog = createDiagramDialog();
  const shells: BlockShell[] = [];

  const diagrams = sources.map((source, index) => {
    const title = source.dataset.title ?? "Mermaid diagram";
    const block = document.createElement("div");
    block.className = "diagram-block";
    block.dataset.enhanced = "true";
    source.replaceWith(block);
    block.append(source);
    source.hidden = true;
    const diagram: Diagram = {
      source,
      title,
      graph: source.textContent ?? "",
      host: block,
      rendered: {},
    };
    const shell = createBlockShell({
      block,
      id: `diagram-${index}`,
      name: title,
      caption: source.dataset.title,
      previewName: "Diagram",
      source: diagram.graph,
      onStatus: report,
      onEdit: (value) => {
        diagram.graph = value;
        clearTimeout(editTimer);
        editTimer = globalThis.setTimeout(() => void render(), editSettle);
      },
      onExpand: (trigger) =>
        dialog.open({ title, host: diagram.host, figure: () => diagram.figure, trigger }),
    });
    diagram.host = shell.preview;
    shells.push(shell);
    return diagram;
  });

  const cached = (diagram: Diagram, scheme: DiagramScheme) => {
    const entry = diagram.rendered[scheme];
    return entry?.graph === diagram.graph ? entry : undefined;
  };

  /** 足りない図だけを描いて控えに入れる。描いた図は DOM には入れない。 */
  const fill = (scheme: DiagramScheme, proceed: () => boolean) =>
    enqueue(async () => {
      const missing = diagrams.filter((diagram) => !cached(diagram, scheme));
      if (!missing.length || !proceed()) return;
      const { default: mermaid } = await import("mermaid");
      const config = mermaidConfig(scheme, prose);
      if (!proceed() || !config) return;
      mermaid.initialize(config);
      for (const diagram of missing) {
        const graph = diagram.graph;
        const figure = await draw(mermaid, diagram);
        if (!proceed()) return;
        diagram.rendered[scheme] = { graph, figure };
      }
    });

  /** 描けなかった記述はソースのまま読めるように出す。 */
  const exposeSource = (diagram: Diagram) => {
    diagram.source.hidden = false;
    diagram.source.setAttribute("aria-label", `${diagram.title}を表示できませんでした`);
  };

  const show = (scheme: DiagramScheme) => {
    for (const diagram of diagrams) {
      const figure = cached(diagram, scheme)?.figure;
      if (figure) {
        if (diagram.figure === figure) continue;
        if (diagram.figure) diagram.figure.replaceWith(figure);
        else diagram.host.append(figure);
        diagram.figure = figure;
        diagram.source.hidden = true;
        diagram.source.removeAttribute("aria-label");
      } else if (!diagram.figure) {
        exposeSource(diagram);
      }
    }
  };

  const prepareSpare = () => {
    cancelSpare?.();
    cancelSpare = whenIdle(() => {
      cancelSpare = undefined;
      const spare: DiagramScheme = currentScheme() === "dark" ? "light" : "dark";
      void fill(spare, () => !disposed).catch(() => undefined);
    });
  };

  async function render() {
    const ticket = ++generation;
    const scheme = currentScheme();
    const current = () => !disposed && ticket === generation;
    if (!diagrams.every((diagram) => cached(diagram, scheme))) {
      try {
        await fill(scheme, current);
      } catch {
        if (current()) diagrams.filter((diagram) => !diagram.figure).forEach(exposeSource);
        return;
      }
      if (!current()) return;
    }
    show(scheme);
    prepareSpare();
  }

  // テーマの切り替えは View Transition の更新の中で起きる。控えがあれば同期的に差し替わる。
  const themeObserver = new MutationObserver(() => void render());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  void render();

  return () => {
    disposed = true;
    generation += 1;
    cancelSpare?.();
    clearTimeout(editTimer);
    themeObserver.disconnect();
    dialog.destroy();
    for (const diagram of diagrams) diagram.figure?.remove();
    shells.forEach((shell) => shell.destroy());
  };
}
