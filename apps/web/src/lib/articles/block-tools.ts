/**
 * コードブロックと図が共有するシェル：描画ビュー、編集可能なソースビュー、コピー、元に戻す。
 *
 * ブロックはコンテンツパイプラインから HTML として届くため、マークアップではなくここで組む。
 * このスクリプトがなくてもブロックは描画され正しく読める（シェルは拡張）。
 */

import { blockToolIcons } from "@lunacea/ui/icons";

export type BlockPanel = "preview" | "source";

export type BlockShell = {
  /** 描画ビューの置き場所（ハイライト済みコード、または図）。 */
  readonly preview: HTMLElement;
  readonly editor: HTMLTextAreaElement;
  select(panel: BlockPanel): void;
  destroy(): void;
};

/* 各ブロックが `--block-ink` に自分のインクを宣言するので、1組のクラスで両方の面に使える。 */
const label = "inline-flex min-h-control items-center border-0 bg-transparent px-(--space-4) " +
  "font-sans font-stretch-84% text-folio leading-none tracking-folio uppercase " +
  "text-[color-mix(in_srgb,var(--block-ink)_66%,transparent)] cursor-pointer " +
  "transition-[color,background-color,translate] duration-(--motion-duration-base) ease-signature " +
  "hover:bg-[color-mix(in_srgb,var(--block-ink)_10%,transparent)] hover:text-(--block-ink) " +
  "focus-visible:bg-[color-mix(in_srgb,var(--block-ink)_10%,transparent)] " +
  "focus-visible:text-(--block-ink) active:translate-y-px";

const rule = "border-[color-mix(in_srgb,var(--block-ink)_22%,transparent)]";

export function createBlockShell({
  block,
  id,
  name,
  caption,
  source,
  previewName = "Preview",
  onEdit,
  onStatus,
  onExpand,
}: {
  /** ブロック要素。既存の子要素がそのまま描画ビューになる。 */
  block: HTMLElement;
  id: string;
  /** 2つのビューのアクセシブルネーム（ファイル名や図の題）。 */
  name: string;
  /** バーに出すブロック自身の名前。 */
  caption?: string;
  source: string;
  previewName?: string;
  /** 読者が編集またはリセットしたときに現在のテキストで呼ばれる。 */
  onEdit?: (value: string) => void;
  onStatus?: (message: string) => void;
  /** 渡すと描画ビューを大きく開くボタンを置く。押したボタンを受け取る。 */
  onExpand?: (trigger: HTMLButtonElement) => void;
}): BlockShell {
  const existing = [...block.childNodes];

  const bar = document.createElement("div");
  bar.className = `grid border-b ${rule}`;

  if (caption) {
    const title = document.createElement("span");
    title.className = `min-w-0 truncate border-b ${rule} px-(--space-4) py-(--space-2) ` +
      "font-mono text-caption leading-none " +
      "text-[color-mix(in_srgb,var(--block-ink)_80%,transparent)]";
    title.textContent = caption;
    bar.append(title);
  }

  const controls = document.createElement("div");
  controls.className = "flex flex-wrap items-stretch justify-between gap-x-(--space-2)";
  bar.append(controls);

  const tabs = document.createElement("div");
  tabs.className = "flex flex-wrap items-stretch";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", `${name}の表示`);
  controls.append(tabs);

  const actions = document.createElement("div");
  actions.className = "flex flex-wrap items-stretch";
  controls.append(actions);

  const preview = document.createElement("div");
  preview.className = "block-preview";
  preview.id = `${id}-preview`;
  preview.setAttribute("role", "tabpanel");
  preview.setAttribute("aria-labelledby", `${id}-preview-tab`);
  preview.append(...existing);

  const editorPanel = document.createElement("div");
  editorPanel.id = `${id}-source`;
  editorPanel.setAttribute("role", "tabpanel");
  editorPanel.setAttribute("aria-labelledby", `${id}-source-tab`);
  editorPanel.hidden = true;

  const editor = document.createElement("textarea");
  editor.id = `${id}-editor`;
  editor.className = "block w-full min-h-[10lh] resize-y border-0 bg-transparent p-(--space-4) " +
    "font-mono text-small leading-copy text-(--block-ink) field-sizing-content " +
    "focus-visible:outline-offset-[-0.25rem]";
  editor.value = source;
  editor.spellcheck = false;
  editor.setAttribute("aria-label", `${name}のソース`);
  editorPanel.append(editor);

  const tabFor = (panel: BlockPanel, text: string) => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = `${id}-${panel}-tab`;
    button.className =
      `${label} aria-selected:text-(--block-ink) aria-selected:shadow-[inset_0_-2px_0_var(--block-ink)]`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel === "preview" ? preview.id : editorPanel.id);
    button.textContent = text;
    tabs.append(button);
    return button;
  };

  const previewTab = tabFor("preview", previewName);
  const sourceTab = tabFor("source", "Source");

  const glyph = (icon: { body: string }, state: "copy" | "copied" | "expand") =>
    `<svg viewBox="0 0 24 24" class="size-(--space-4)" data-glyph="${state}" aria-hidden="true" focusable="false">${icon.body}</svg>`;
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = `${label} border-l ${rule}`;
  copy.setAttribute("aria-label", `${name}をコピー`);
  copy.innerHTML = glyph(blockToolIcons.copy, "copy");

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = `${label} border-l ${rule}`;
  reset.textContent = "Reset";
  reset.hidden = true;
  actions.append(reset);
  if (onExpand) {
    const expand = document.createElement("button");
    expand.type = "button";
    expand.className = `${label} border-l ${rule}`;
    expand.setAttribute("aria-label", `${name}を拡大`);
    expand.setAttribute("aria-haspopup", "dialog");
    expand.innerHTML = glyph(blockToolIcons.expand, "expand");
    expand.addEventListener("click", () => onExpand(expand));
    actions.append(expand);
  }
  actions.append(copy);

  block.append(bar, preview, editorPanel);

  let statusTimer: ReturnType<typeof setTimeout> | undefined;

  const rest = () => {
    copy.innerHTML = glyph(blockToolIcons.copy, "copy");
    copy.setAttribute("aria-label", `${name}をコピー`);
  };
  const announce = (message: string, copied: boolean) => {
    copy.innerHTML = glyph(
      copied ? blockToolIcons.copied : blockToolIcons.copy,
      copied ? "copied" : "copy",
    );
    copy.setAttribute("aria-label", message);
    onStatus?.(message);
    clearTimeout(statusTimer);
    statusTimer = setTimeout(rest, 2400);
  };

  const select = (panel: BlockPanel) => {
    for (const [tab, owned] of [[previewTab, "preview"], [sourceTab, "source"]] as const) {
      const selected = owned === panel;
      tab.setAttribute("aria-selected", String(selected));
      // ビューが2つだけなので、矢印キーではなく Tab で辿れるよう両方をタブ順に残す。
      tab.tabIndex = 0;
    }
    preview.hidden = panel !== "preview";
    editorPanel.hidden = panel !== "source";
  };

  const step = (event: KeyboardEvent) => {
    const moves: Record<string, BlockPanel> = {
      ArrowLeft: "preview",
      ArrowRight: "source",
      Home: "preview",
      End: "source",
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    select(next);
    (next === "preview" ? previewTab : sourceTab).focus();
  };

  const edited = () => {
    const changed = editor.value !== source;
    reset.hidden = !changed;
    onEdit?.(editor.value);
  };

  const restore = () => {
    editor.value = source;
    reset.hidden = true;
    onEdit?.(source);
    onStatus?.(`${name}を元に戻しました`);
    editor.focus();
  };

  const write = async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      announce(`${name}をコピーしました`, true);
    } catch {
      announce(`${name}をコピーできませんでした`, false);
    }
  };

  previewTab.addEventListener("click", () => select("preview"));
  sourceTab.addEventListener("click", () => select("source"));
  previewTab.addEventListener("keydown", step);
  sourceTab.addEventListener("keydown", step);
  editor.addEventListener("input", edited);
  reset.addEventListener("click", restore);
  copy.addEventListener("click", () => void write());

  select("preview");

  return {
    preview,
    editor,
    select,
    destroy() {
      clearTimeout(statusTimer);
      block.append(...[...preview.childNodes]);
      bar.remove();
      preview.remove();
      editorPanel.remove();
      block.removeAttribute("data-enhanced");
    },
  };
}
