/**
 * Code and diagram blocks in an article are read far more often than they are copied, but when a
 * reader does want the source they want all of it, and when they want to try a change they want it
 * without leaving the page. Both kinds of block therefore carry the same shell: a rendered view, an
 * editable source view, a copy of whatever the source currently says, and a way back to the
 * original.
 *
 * The shell is built here rather than in markup because the blocks arrive as HTML from the content
 * pipeline. Without this script the block still renders and still reads correctly — the shell is an
 * enhancement, and every control it adds is a real button with a real label.
 */

export type BlockPanel = "preview" | "source";

export type BlockShell = {
  /** Where the rendered view belongs: highlighted code, or a diagram. */
  readonly preview: HTMLElement;
  readonly editor: HTMLTextAreaElement;
  select(panel: BlockPanel): void;
  destroy(): void;
};

/*
 * Both kinds of block declare their own ink in `--block-ink` — the code palette on a code block,
 * the page's ink on a diagram — so one set of classes serves both surfaces.
 */
const label = "inline-flex min-h-control items-center border-0 bg-transparent px-(--space-4) " +
  "font-sans font-stretch-84% text-folio leading-none tracking-folio uppercase " +
  "text-[color-mix(in_srgb,var(--block-ink)_66%,transparent)] cursor-pointer " +
  "transition-[color,background-color,translate] duration-(--motion-duration-fast) ease-standard " +
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
}: {
  /** The block element; its existing children become the rendered view. */
  block: HTMLElement;
  id: string;
  /** Accessible name of the pair of views, e.g. the file name or the diagram title. */
  name: string;
  /** The block's own identity, shown in the bar: a file name, or the diagram's title. */
  caption?: string;
  source: string;
  previewName?: string;
  /** Called with the current text whenever the reader edits or resets it. */
  onEdit?: (value: string) => void;
  onStatus?: (message: string) => void;
}): BlockShell {
  const existing = [...block.childNodes];

  const bar = document.createElement("div");
  bar.className = `flex flex-wrap items-stretch justify-between gap-x-(--space-2) border-b ${rule}`;

  // The block's identity stays in the bar next to the views it belongs to.
  const left = document.createElement("div");
  left.className = "flex min-w-0 items-stretch";
  if (caption) {
    const title = document.createElement("span");
    title.className = "flex min-w-0 items-center truncate pl-(--space-4) pr-(--space-2) " +
      "font-mono text-caption leading-none " +
      "text-[color-mix(in_srgb,var(--block-ink)_80%,transparent)]";
    title.textContent = caption;
    left.append(title);
  }

  const tabs = document.createElement("div");
  tabs.className = "flex items-stretch";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", `${name}の表示`);
  left.append(tabs);

  const actions = document.createElement("div");
  actions.className = "flex items-stretch";

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

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = `${label} border-l ${rule}`;
  copy.textContent = "Copy";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = `${label} border-l ${rule}`;
  reset.textContent = "Reset";
  // Nothing has been changed yet, so there is nothing to go back to.
  reset.hidden = true;
  actions.append(reset, copy);

  bar.append(left, actions);
  block.append(bar, preview, editorPanel);

  let statusTimer: ReturnType<typeof setTimeout> | undefined;

  const announce = (message: string, text: string) => {
    copy.textContent = text;
    onStatus?.(message);
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (copy.textContent = "Copy"), 2400);
  };

  const select = (panel: BlockPanel) => {
    for (const [tab, owned] of [[previewTab, "preview"], [sourceTab, "source"]] as const) {
      const selected = owned === panel;
      tab.setAttribute("aria-selected", String(selected));
      // Both tabs stay in the tab order: with only two views, a reader looking for the source
      // should find it by tabbing rather than having to guess at an arrow key.
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
      announce(`${name}をコピーしました`, "Copied");
    } catch {
      announce(`${name}をコピーできませんでした`, "Failed");
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
      // The block goes back to exactly the markup the page was served with.
      block.append(...[...preview.childNodes]);
      bar.remove();
      preview.remove();
      editorPanel.remove();
      block.removeAttribute("data-enhanced");
    },
  };
}
