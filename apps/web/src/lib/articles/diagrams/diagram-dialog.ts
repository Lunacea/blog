import { blockToolIcons } from "@lunacea/ui/icons";
import { motionDuration, motionEasing } from "$lib/motion-tokens.ts";

/**
 * 図を大きく開くモーダル。複製すると SVG 内の id（スタイルと矢印の参照先）が重複するため、
 * 開いている間は図そのものをダイアログへ移し、閉じたら元の置き場所へ戻す。
 *
 * 面は拡大ボタンの位置から広がって開き、閉じるとボタンへ縮んで戻る。図がその場で大きくなった
 * と読めるようにするため。背景の暗さは editorial.css が同じ長さで溶かす。
 */

type Opening = {
  title: string;
  /** 図の置き場所。閉じたときにここへ戻す。 */
  host: HTMLElement;
  /** その時点の図。開いている間にテーマが変わると差し替わるため、都度読む。 */
  figure: () => HTMLElement | undefined;
  trigger: HTMLElement;
};

const animated = () => document.documentElement.dataset.motion === "full";

/** ボタンの中心を起点に、ボタンほどの大きさから面の大きさへ。縦横比は崩さない。 */
function fromTrigger(dialog: HTMLElement, trigger: HTMLElement) {
  const panel = dialog.getBoundingClientRect();
  const button = trigger.getBoundingClientRect();
  const originX = button.left + button.width / 2 - panel.left;
  const originY = button.top + button.height / 2 - panel.top;
  const scale = Math.max(button.width / panel.width, button.height / panel.height, 0.06);
  return {
    folded: { transformOrigin: `${originX}px ${originY}px`, scale: `${scale}`, opacity: 0 },
    open: { transformOrigin: `${originX}px ${originY}px`, scale: "1", opacity: 1 },
  };
}

export function createDiagramDialog() {
  let dialog: HTMLDialogElement | undefined;
  let heading: HTMLElement;
  let body: HTMLElement;
  let active: Opening | undefined;
  let motion: Animation | undefined;

  /** 図を元の置き場所へ戻し、フォーカスを拡大ボタンへ返す。 */
  const restore = () => {
    if (!active) return;
    const { host, figure, trigger } = active;
    active = undefined;
    const current = figure();
    if (current) host.append(current);
    host.style.minHeight = "";
    trigger.focus({ preventScroll: true });
  };

  /** 退場の動きが終わってから閉じる。モーションを止めている読者にはすぐ閉じる。 */
  const requestClose = () => {
    const target = dialog;
    if (!target?.open || target.dataset.state === "closed") return;
    if (!animated() || !active) {
      target.close();
      return;
    }
    target.dataset.state = "closed";
    const frames = fromTrigger(target, active.trigger);
    motion?.cancel();
    motion = target.animate([frames.open, frames.folded], {
      duration: motionDuration("exit"),
      easing: motionEasing("exit"),
      fill: "forwards",
    });
    void motion.finished.then(() => target.close(), () => {});
  };

  const build = () => {
    /*
     * 全画面にすると別のページへ移ったように見えるため、どの幅でも周囲に記事を残す。
     * 背景は薄く暗くぼかすだけにして、面が記事の上に載っていると読めるようにする。
     * 高さは図に合わせ、上限を超える図だけを面の中でスクロールさせる。
     */
    const element = document.createElement("dialog");
    element.className = "diagram-dialog m-auto max-w-none flex-col border border-rule " +
      "bg-panel p-0 text-ink shadow-ui-overlay open:flex " +
      "max-h-[min(calc(100dvh-2*var(--space-16)),46rem)] " +
      "w-[min(calc(100vw-2*var(--space-16)),76rem)] " +
      "max-sm:max-h-[calc(100dvh-2*var(--space-12))] " +
      "max-sm:w-[calc(100vw-2*var(--layout-gutter))] " +
      "backdrop:bg-[color-mix(in_srgb,var(--color-foreground)_18%,transparent)] " +
      "backdrop:backdrop-blur-[2px]";
    element.setAttribute("aria-labelledby", "diagram-dialog-title");

    // バーと閉じるボタンはサイトのヘッダーと同じ寸法と余白、表示設定のボタンと同じ応答にする。
    const bar = document.createElement("div");
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
    close.addEventListener("click", requestClose);
    bar.append(heading, close);

    body = document.createElement("div");
    body.className = "flex min-h-0 flex-1 overflow-auto overscroll-contain p-(--layout-gutter)";
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
      motion?.cancel();
      motion = undefined;
      delete element.dataset.state;
      restore();
    });
    document.body.append(element);
    return element;
  };

  return {
    open(opening: Opening) {
      const current = opening.figure();
      if (!current) return;
      dialog ??= build();
      if (dialog.open) return;
      heading.textContent = opening.title;
      // 図が抜けても本文の高さが変わらないようにし、閉じたときの位置を保つ。
      opening.host.style.minHeight = `${opening.host.offsetHeight}px`;
      body.append(current);
      active = opening;
      dialog.dataset.state = "open";
      dialog.showModal();
      body.scrollTo(0, 0);
      if (!animated()) return;
      const frames = fromTrigger(dialog, opening.trigger);
      motion = dialog.animate([frames.folded, frames.open], {
        duration: motionDuration("base"),
        easing: motionEasing("enter"),
      });
    },
    destroy() {
      motion?.cancel();
      if (dialog?.open) dialog.close();
      restore();
      dialog?.remove();
      dialog = undefined;
    },
  };
}
