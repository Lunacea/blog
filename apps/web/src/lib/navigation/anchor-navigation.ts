/**
 * 同じページ内のアンカー移動。滑らかなスクロールと、移動中のホバーの誤爆止めだけを受け持つ。
 */
export function installAnchorNavigation() {
  if (typeof document === "undefined") return () => {};
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
  let jumpFrom: { x: number; y: number } | undefined;
  // 時間で戻すと、止まったカーソルの下で同じことが遅れて起きるだけなので、
  // ポインタが実際に動くまで解除しない。
  const release = () => {
    jumpFrom = undefined;
    delete document.documentElement.dataset.anchorJump;
  };
  // クリック自身も pointermove を伴うので、実際に離れて動いたときだけ解除する。
  const handlePointerMove = (event: PointerEvent) => {
    if (!jumpFrom) return;
    if (Math.hypot(event.clientX - jumpFrom.x, event.clientY - jumpFrom.y) < 8) return;
    release();
  };
  const handleClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey
    ) return;
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.target || anchor.origin !== location.origin) return;
    if (
      anchor.pathname !== location.pathname || anchor.search !== location.search || !anchor.hash
    ) return;
    // 内容がカーソルの下を通り過ぎることで起きるホバーの誤爆を、移動の間だけ抑える。
    // モーション設定に関わらず起きるので、滑らかな移動とは別の印にする。
    document.documentElement.dataset.anchorJump = "true";
    jumpFrom = { x: event.clientX, y: event.clientY };
    if (document.documentElement.dataset.motion !== "full") return;
    document.documentElement.dataset.smoothAnchor = "true";
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = globalThis.setTimeout(
      () => delete document.documentElement.dataset.smoothAnchor,
      1000,
    );
  };
  document.addEventListener("click", handleClick, { capture: true });
  document.addEventListener("pointermove", handlePointerMove, { passive: true });
  return () => {
    if (timeout !== undefined) clearTimeout(timeout);
    delete document.documentElement.dataset.smoothAnchor;
    delete document.documentElement.dataset.anchorJump;
    document.removeEventListener("click", handleClick, { capture: true });
    document.removeEventListener("pointermove", handlePointerMove);
  };
}
