/**
 * 図を画面いっぱいに開くモーダル。複製すると SVG 内の id（スタイルと矢印の参照先）が重複するため、
 * 開いている間は図そのものをダイアログへ移し、閉じたら元の置き場所へ戻す。
 */

import { blockToolIcons } from "@lunacea/ui/icons";

export type DiagramDialog = {
  open(options: {
    title: string;
    /** 図の置き場所。閉じたときにここへ戻す。 */
    host: HTMLElement;
    /** その時点の図。開いている間にテーマが変わると差し替わるため、都度読む。 */
    figure: () => HTMLElement | undefined;
    trigger: HTMLElement;
  }): void;
  destroy(): void;
};

export function createDiagramDialog(): DiagramDialog {
  let dialog: HTMLDialogElement | undefined;
  let heading: HTMLElement;
  let body: HTMLElement;
  let active:
    | { host: HTMLElement; figure: () => HTMLElement | undefined; trigger: HTMLElement }
    | undefined;

  const restore = () => {
    if (!active) return;
    const { host, figure, trigger } = active;
    active = undefined;
    const current = figure();
    if (current) host.append(current);
    host.style.minHeight = "";
    trigger.focus({ preventScroll: true });
  };

  const build = () => {
    const element = document.createElement("dialog");
    element.className = "diagram-dialog m-auto max-h-none max-w-none flex-col border border-rule " +
      "bg-panel p-0 text-ink shadow-ui-overlay open:flex " +
      "h-[min(calc(100dvh-2*var(--layout-gutter)),60rem)] " +
      "w-[min(calc(100vw-2*var(--layout-gutter)),90rem)] " +
      "backdrop:bg-(--color-glass) backdrop:backdrop-blur-glass " +
      "motion-full:open:animate-disclosure-in max-sm:size-full max-sm:border-0";
    element.setAttribute("aria-labelledby", "diagram-dialog-title");
    element.setAttribute("closedby", "any");

    const bar = document.createElement("div");
    bar.className = "flex shrink-0 items-center justify-between gap-(--space-4) border-b " +
      "border-rule ps-(--space-4)";
    heading = document.createElement("h2");
    heading.id = "diagram-dialog-title";
    heading.className = "m-0 min-w-0 truncate font-sans text-small font-component text-ink";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "inline-grid size-control min-h-control shrink-0 cursor-pointer " +
      "place-items-center border-0 border-l border-rule bg-transparent text-quiet " +
      "transition-colors duration-(--motion-duration-base) ease-signature hover:text-ink " +
      "focus-visible:text-ink";
    close.setAttribute("aria-label", "閉じる");
    close.innerHTML =
      `<svg viewBox="0 0 24 24" class="size-(--space-5)" aria-hidden="true" focusable="false">${blockToolIcons.close.body}</svg>`;
    close.addEventListener("click", () => element.close());
    bar.append(heading, close);

    body = document.createElement("div");
    body.className = "diagram-dialog-body flex min-h-0 flex-1 overflow-auto overscroll-contain " +
      "p-(--space-6) max-sm:p-(--space-4)";
    element.append(bar, body);

    // closedby を持たないブラウザでも、図の外側（背景）を押したら閉じる。
    element.addEventListener("click", (event) => {
      if (event.target === element) element.close();
    });
    element.addEventListener("close", restore);
    document.body.append(element);
    return element;
  };

  return {
    open({ title, host, figure, trigger }) {
      const current = figure();
      if (!current) return;
      dialog ??= build();
      if (dialog.open) return;
      heading.textContent = title;
      // 図が抜けても本文の高さが変わらないようにし、閉じたときの位置を保つ。
      host.style.minHeight = `${host.offsetHeight}px`;
      body.append(current);
      active = { host, figure, trigger };
      dialog.showModal();
      body.scrollTo(0, 0);
    },
    destroy() {
      if (dialog?.open) dialog.close();
      restore();
      dialog?.remove();
      dialog = undefined;
    },
  };
}
