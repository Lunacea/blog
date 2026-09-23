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

  let closing: ReturnType<typeof globalThis.setTimeout> | undefined;
  /** 退場の動きが終わってから閉じる。モーションを止めている読者にはすぐ閉じる。 */
  const requestClose = () => {
    if (!dialog?.open || closing !== undefined) return;
    const target = dialog;
    if (document.documentElement.dataset.motion !== "full") {
      target.close();
      return;
    }
    target.dataset.state = "closed";
    const finish = () => {
      if (closing === undefined) return;
      clearTimeout(closing);
      closing = undefined;
      target.removeEventListener("animationend", onEnd);
      if (target.open) target.close();
    };
    const onEnd = (event: AnimationEvent) => {
      if (event.target === target) finish();
    };
    target.addEventListener("animationend", onEnd);
    // animationend が来ない環境でも閉じられるよう、退場の長さに少し足して打ち切る。
    closing = globalThis.setTimeout(finish, 400);
  };

  const build = () => {
    const element = document.createElement("dialog");
    // 開閉は検索パネルと同じ組で動かす。背景の溶け方は editorial.css が同じ速さで揃える。
    element.className = "diagram-dialog m-auto max-h-none max-w-none flex-col border border-rule " +
      "bg-panel p-0 text-ink shadow-ui-overlay open:flex " +
      "h-[min(calc(100dvh-2*var(--layout-gutter)),60rem)] " +
      "w-[min(calc(100vw-2*var(--layout-gutter)),90rem)] " +
      "backdrop:bg-(--color-glass) backdrop:backdrop-blur-glass " +
      "data-[state=open]:animate-disclosure-in data-[state=closed]:animate-disclosure-out " +
      "max-sm:size-full max-sm:border-0";
    element.setAttribute("aria-labelledby", "diagram-dialog-title");

    const bar = document.createElement("div");
    // バーと閉じるボタンはサイトのヘッダーと同じ寸法と余白、表示設定のボタンと同じ応答にする。
    bar.className = "flex shrink-0 items-center justify-between gap-(--space-4) border-b " +
      "border-rule px-(--layout-gutter) py-(--space-2)";
    heading = document.createElement("h2");
    heading.id = "diagram-dialog-title";
    heading.className = "m-0 min-w-0 truncate font-mono text-caption leading-none font-regular " +
      "text-ink";
    const close = document.createElement("button");
    close.type = "button";
    close.className =
      "grid size-control min-h-control shrink-0 cursor-pointer place-items-center " +
      "border-0 bg-transparent p-0 text-xl text-quiet pressable [--press-scale:0.9] " +
      "transition-[translate,scale,color,background-color] duration-(--motion-duration-base) " +
      "ease-signature hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas";
    close.setAttribute("aria-label", "閉じる");
    close.innerHTML =
      `<svg viewBox="0 0 24 24" class="size-[1.2em]" aria-hidden="true" focusable="false">${blockToolIcons.close.body}</svg>`;
    close.addEventListener("click", () => requestClose());
    bar.append(heading, close);

    body = document.createElement("div");
    body.className = "diagram-dialog-body flex min-h-0 flex-1 overflow-auto overscroll-contain " +
      "p-(--layout-gutter)";
    element.append(bar, body);

    // 図の外側（背景）を押しても閉じる。
    element.addEventListener("click", (event) => {
      if (event.target === element) requestClose();
    });
    // Esc でも退場の動きを見せてから閉じる。
    element.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestClose();
    });
    element.addEventListener("close", () => {
      delete element.dataset.state;
      restore();
    });
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
      dialog.dataset.state = "open";
      dialog.showModal();
      body.scrollTo(0, 0);
    },
    destroy() {
      if (closing !== undefined) clearTimeout(closing);
      closing = undefined;
      if (dialog?.open) dialog.close();
      restore();
      dialog?.remove();
      dialog = undefined;
    },
  };
}
