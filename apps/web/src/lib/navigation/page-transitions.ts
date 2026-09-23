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

function headerChange(from?: URL, to?: URL): "enter" | "leave" | undefined {
  if (!from || !to) return undefined;
  const fromHome = from.pathname === "/";
  const toHome = to.pathname === "/";
  if (fromHome && !toHome) return "enter";
  if (!fromHome && toHome) return "leave";
  return undefined;
}

function isPaperHandoff(from?: URL, to?: URL): boolean {
  if (!from || !to) return false;
  const listing = from.pathname === "/" || from.pathname === "/articles";
  return listing && /^\/articles\/[^/]+$/.test(to.pathname);
}

/** 記事から、その記事の行がある一覧へ戻る遷移。紙面を元の行へ畳んで返す。 */
export function isPaperReturn(from?: URL | null, to?: URL | null): boolean {
  if (!from || !to) return false;
  return /^\/articles\/[^/]+$/.test(from.pathname) &&
    (to.pathname === "/" || to.pathname === "/articles");
}

function motionToken(name: string) {
  const style = getComputedStyle(document.documentElement);
  const duration = Number.parseFloat(style.getPropertyValue(`--motion-duration-${name}`)) || 0;
  return duration;
}

/**
 * 紙面は記事全体の高さを持つため、そのまま行へ補間すると画面外の下端が一気に上がってくる。
 * 補間の始まりを見えていた範囲に切り詰め、旧紙面の画像もその範囲が見える位置へずらす。
 */
function foldPaperIntoRow(paper: DOMRect, row: DOMRect) {
  const top = Math.max(paper.top, 0);
  const bottom = Math.min(paper.bottom, innerHeight);
  const height = Math.max(bottom - top, row.height);
  const offset = top - paper.top;
  const scale = row.width / Math.max(paper.width, 1);
  const style = getComputedStyle(document.documentElement);
  const timing = {
    duration: motionToken("page"),
    easing: style.getPropertyValue("--motion-ease-signature").trim() || "ease",
    fill: "both" as const,
  };
  const root = document.documentElement;
  root.animate([
    {
      transform: `translate(${paper.left}px, ${top}px)`,
      width: `${paper.width}px`,
      height: `${height}px`,
    },
    {
      transform: `translate(${row.left}px, ${row.top}px)`,
      width: `${row.width}px`,
      height: `${row.height}px`,
    },
  ], { ...timing, pseudoElement: "::view-transition-group(article-paper)" });
  root.animate([
    { top: `${-offset}px` },
    { top: `${-offset * scale}px` },
  ], { ...timing, pseudoElement: "::view-transition-old(article-paper)" });
}

export function installPageTransitions() {
  if (typeof document === "undefined") return () => {};
  let catalogPosition: { x: number; y: number } | undefined;
  let pageEnterFallback: ReturnType<typeof globalThis.setTimeout> | undefined;
  afterNavigate(() => {
    if (!catalogPosition) return;
    const position = catalogPosition;
    catalogPosition = undefined;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollTo(position.x, position.y));
    });
  });
  onNavigate((navigation) => {
    delete document.documentElement.dataset.paperHandoff;
    delete document.documentElement.dataset.paperReturn;
    document.querySelector("[data-paper-return-row]")?.removeAttribute("data-paper-return-row");
    delete document.documentElement.dataset.headerChange;
    delete document.documentElement.dataset.pageEnter;
    delete document.documentElement.dataset.routeExit;
    if (pageEnterFallback !== undefined) {
      clearTimeout(pageEnterFallback);
      pageEnterFallback = undefined;
    }
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
    if (
      !canUsePageTransition({
        type: navigation.type,
        from: navigation.from?.url,
        to: navigation.to?.url,
      })
    ) {
      return;
    }
    return new Promise<void>((resolve) => {
      if (catalogTransition) document.documentElement.dataset.catalogTransition = "true";
      const handoff = isPaperHandoff(navigation.from?.url, navigation.to?.url);
      if (handoff) document.documentElement.dataset.paperHandoff = "true";
      const header = headerChange(navigation.from?.url, navigation.to?.url);
      if (header) document.documentElement.dataset.headerChange = header;
      // 旧ページの本文だけを snapshot にして、その場で溶かす。新しい本文は live DOM のまま
      // fade in させるので、名前は旧状態の撮影後すぐに外す。
      document.documentElement.dataset.routeExit = "true";
      const returning = isPaperReturn(navigation.from?.url, navigation.to?.url);
      const paper = returning
        ? document.querySelector(".article-paper")?.getBoundingClientRect()
        : undefined;
      let fold: { paper: DOMRect; row: DOMRect } | undefined;
      const transition = document.startViewTransition(async () => {
        delete document.documentElement.dataset.routeExit;
        resolve();
        await navigation.complete;
        // 戻った先で同じ記事の行が見えているときだけ、紙面をその行へ受け渡す。
        const from = navigation.from?.url.pathname;
        const row = paper && from
          ? [...document.querySelectorAll<HTMLAnchorElement>(".index-list a[href]")]
            .find((link) => link.pathname === from)?.closest("li")
          : undefined;
        const bounds = row?.getBoundingClientRect();
        if (paper && row && bounds && bounds.bottom > 0 && bounds.top < innerHeight) {
          row.dataset.paperReturnRow = "true";
          document.documentElement.dataset.paperReturn = "true";
          fold = { paper, row: bounds };
        }
        document.documentElement.dataset.pageEnter = "active";
        pageEnterFallback = globalThis.setTimeout(() => {
          delete document.documentElement.dataset.pageEnter;
          pageEnterFallback = undefined;
        }, 1200);
      });
      void transition.ready.then(() => {
        if (fold) foldPaperIntoRow(fold.paper, fold.row);
      }, () => {});
      if (catalogTransition) {
        void transition.finished.finally(() => {
          delete document.documentElement.dataset.catalogTransition;
        });
      }
      const clearMarks = () => {
        delete document.documentElement.dataset.routeExit;
        delete document.documentElement.dataset.paperHandoff;
        delete document.documentElement.dataset.paperReturn;
        document.querySelector("[data-paper-return-row]")?.removeAttribute(
          "data-paper-return-row",
        );
        delete document.documentElement.dataset.headerChange;
      };
      const fallback = globalThis.setTimeout(clearMarks, 1200);
      void transition.finished.finally(() => {
        clearTimeout(fallback);
        clearMarks();
      });
    });
  });

  return () => {
    if (pageEnterFallback !== undefined) clearTimeout(pageEnterFallback);
    delete document.documentElement.dataset.pageEnter;
    delete document.documentElement.dataset.routeExit;
  };
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
