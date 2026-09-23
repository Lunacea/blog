import { type BlockShell, createBlockShell } from "./block-tools.ts";

/**
 * 本文のコードブロックを「ハイライト済みの描画」と「編集できるソース」の2ビューにする。
 * 編集されたブロックはプレビューにも読者のテキストを出し、2つのビューが食い違わないようにする。
 */
export function enhanceCodeBlocks(
  prose: HTMLElement,
  report: (message: string) => void,
): () => void {
  // 横スクロールする面はキーボードから到達できる必要がある。図の定義も同じ扱い。
  for (const scroller of prose.querySelectorAll<HTMLElement>("pre")) {
    scroller.tabIndex = 0;
    scroller.setAttribute("role", "region");
    scroller.setAttribute(
      "aria-label",
      scroller.closest<HTMLElement>(".code-block")?.dataset.title ??
        (scroller.classList.contains("mermaid-source") ? "図の定義" : "コード"),
    );
  }

  const shells: BlockShell[] = [];
  prose.querySelectorAll<HTMLElement>(".code-block").forEach((block, index) => {
    const source = block.querySelector("code")?.textContent ?? "";
    const name = block.dataset.title ?? block.dataset.language ?? "コード";
    const original = block.querySelector("pre");
    let plain: HTMLPreElement | undefined;
    const shell = createBlockShell({
      block,
      id: `code-${index}`,
      name,
      caption: block.dataset.title,
      source,
      onStatus: report,
      onEdit: (value) => {
        if (value === source) {
          plain?.remove();
          plain = undefined;
          if (original) original.hidden = false;
          return;
        }
        if (!plain) {
          plain = document.createElement("pre");
          plain.className = "m-0 overflow-x-auto p-(--space-4) font-mono text-small leading-copy";
          plain.tabIndex = 0;
          plain.setAttribute("role", "region");
          plain.setAttribute("aria-label", `${name}（編集中）`);
          shell.preview.append(plain);
        }
        plain.textContent = value;
        if (original) original.hidden = true;
      },
    });
    block.dataset.enhanced = "true";
    shells.push(shell);
  });

  return () => shells.forEach((shell) => shell.destroy());
}
