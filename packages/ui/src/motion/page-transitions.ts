import { afterNavigate, onNavigate } from "$app/navigation";

export function isCatalogViewTransition(from?: URL | null, to?: URL | null): boolean {
  if (!from || !to || from.pathname !== to.pathname || from.hash !== to.hash) return false;
  const fromParams = new URLSearchParams(from.search);
  const toParams = new URLSearchParams(to.search);
  const fromView = fromParams.get("view");
  const toView = toParams.get("view");
  if (fromView === toView) return false;
  fromParams.delete("view");
  toParams.delete("view");
  fromParams.sort();
  toParams.sort();
  return fromParams.toString() === toParams.toString();
}

export function canUsePageTransition({
  type,
  from,
  to,
}: {
  type?: string;
  from?: URL | null;
  to?: URL | null;
}): boolean {
  if (typeof document.startViewTransition !== "function") return false;
  if (document.visibilityState !== "visible") return false;
  if (document.documentElement.dataset.motion !== "full") return false;
  if (type === "popstate") return false;
  if (
    from && to && from.pathname === to.pathname && from.search !== to.search &&
    !isCatalogViewTransition(from, to)
  ) return false;
  if (
    from && to && from.pathname === to.pathname && from.search === to.search &&
    from.hash !== to.hash
  ) {
    return false;
  }
  return true;
}

/** ヘッダを持たないのはホームだけ。出入りするときだけ上下させる。 */
function headerChange(from?: URL, to?: URL): "enter" | "leave" | undefined {
  if (!from || !to) return undefined;
  const fromHome = from.pathname === "/";
  const toHome = to.pathname === "/";
  if (fromHome && !toHome) return "enter";
  if (!fromHome && toHome) return "leave";
  return undefined;
}

/** 一覧から記事へ入る移動か。紙を手渡す演出はこのときだけ。 */
function isPaperHandoff(from?: URL, to?: URL): boolean {
  if (!from || !to) return false;
  const listing = from.pathname === "/" || from.pathname === "/articles";
  return listing && /^\/articles\/[^/]+$/.test(to.pathname);
}

export function installPageTransitions() {
  if (typeof document === "undefined") return () => {};
  let catalogPosition: { x: number; y: number } | undefined;
  const handleDirectionClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      "a[data-content-direction]",
    );
    if (!link) return;
    const direction = link.dataset.contentDirection;
    if (direction === "previous" || direction === "next") {
      document.documentElement.dataset.contentDirection = direction;
    }
  };
  document.addEventListener("click", handleDirectionClick, { capture: true });
  afterNavigate(() => {
    if (!catalogPosition) return;
    const position = catalogPosition;
    catalogPosition = undefined;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollTo(position.x, position.y));
    });
  });
  onNavigate((navigation) => {
    // 前の遷移の印が残っていても、新しい遷移には持ち込まない。
    delete document.documentElement.dataset.paperHandoff;
    delete document.documentElement.dataset.headerChange;
    const catalogTransition = isCatalogViewTransition(
      navigation.from?.url,
      navigation.to?.url,
    );
    const preserveCatalogPosition = navigation.type !== "popstate" &&
      navigation.from?.url.pathname === navigation.to?.url.pathname &&
      navigation.from?.url.search !== navigation.to?.url.search;
    if (preserveCatalogPosition) {
      catalogPosition = { x: scrollX, y: scrollY };
    }
    if (navigation.type === "popstate") delete document.documentElement.dataset.contentDirection;
    if (
      !canUsePageTransition({
        type: navigation.type,
        from: navigation.from?.url,
        to: navigation.to?.url,
      })
    ) {
      delete document.documentElement.dataset.contentDirection;
      return;
    }
    return new Promise<void>((resolve) => {
      if (catalogTransition) document.documentElement.dataset.catalogTransition = "true";
      const handoff = isPaperHandoff(navigation.from?.url, navigation.to?.url);
      if (handoff) document.documentElement.dataset.paperHandoff = "true";
      const header = headerChange(navigation.from?.url, navigation.to?.url);
      if (header) document.documentElement.dataset.headerChange = header;
      const transition = document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
      if (catalogTransition) {
        void transition.finished.finally(() => {
          delete document.documentElement.dataset.catalogTransition;
        });
      }
      /*
        通常は finished で落とす。ただし解決しない経路があるので、
        アニメーションが終わり切る時間だけ待つ保険も置く。
        afterNavigate では早すぎる（更新完了＝アニメーション開始）。
      */
      const clearMarks = () => {
        delete document.documentElement.dataset.contentDirection;
        delete document.documentElement.dataset.paperHandoff;
        delete document.documentElement.dataset.headerChange;
      };
      const fallback = globalThis.setTimeout(clearMarks, 1200);
      void transition.finished.finally(() => {
        clearTimeout(fallback);
        clearMarks();
      });
    });
  });

  return () => document.removeEventListener("click", handleDirectionClick, { capture: true });
}

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
