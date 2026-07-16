import { onNavigate } from "$app/navigation";

export function installPageTransitions() {
  onNavigate((navigation) => {
    if (typeof document.startViewTransition !== "function") return;
    if (document.documentElement.dataset.motion !== "full") return;
    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
}
