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
      const transition = document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
      if (catalogTransition) {
        void transition.finished.finally(() => {
          delete document.documentElement.dataset.catalogTransition;
        });
      }
      void transition.finished.finally(() => {
        delete document.documentElement.dataset.contentDirection;
      });
    });
  });

  return () => document.removeEventListener("click", handleDirectionClick, { capture: true });
}

export function installAnchorNavigation() {
  if (typeof document === "undefined") return () => {};
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
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
    if (document.documentElement.dataset.motion !== "full") return;
    document.documentElement.dataset.smoothAnchor = "true";
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = globalThis.setTimeout(
      () => delete document.documentElement.dataset.smoothAnchor,
      1000,
    );
  };
  document.addEventListener("click", handleClick, { capture: true });
  return () => {
    if (timeout !== undefined) clearTimeout(timeout);
    delete document.documentElement.dataset.smoothAnchor;
    document.removeEventListener("click", handleClick, { capture: true });
  };
}
