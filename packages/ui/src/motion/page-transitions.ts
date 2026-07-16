import { onNavigate } from "$app/navigation";

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
    from && to && from.pathname === to.pathname && from.search === to.search &&
    from.hash !== to.hash
  ) {
    return false;
  }
  return true;
}

export function installPageTransitions() {
  onNavigate((navigation) => {
    if (
      !canUsePageTransition({
        type: navigation.type,
        from: navigation.from?.url,
        to: navigation.to?.url,
      })
    ) return;
    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
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
