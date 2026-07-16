type Navigation = { complete: Promise<void> };
type OnNavigate = (navigation: Navigation) => unknown;
type AfterNavigate = () => unknown;

const onNavigateCallbacks = new Set<OnNavigate>();
const afterNavigateCallbacks = new Set<AfterNavigate>();

export function onNavigate(callback: OnNavigate) {
  onNavigateCallbacks.add(callback);
}

export function afterNavigate(callback: AfterNavigate) {
  afterNavigateCallbacks.add(callback);
}

export function resetNavigationMocks() {
  onNavigateCallbacks.clear();
  afterNavigateCallbacks.clear();
}

export async function simulateNavigation(update: () => void) {
  let completeNavigation = () => {};
  const complete = new Promise<void>((resolve) => {
    completeNavigation = resolve;
  });
  const readiness = [...onNavigateCallbacks].map((callback) => callback({ complete }));
  await Promise.all(
    readiness.filter((value): value is PromiseLike<unknown> =>
      typeof (value as PromiseLike<unknown> | undefined)?.then === "function"
    ),
  );
  update();
  completeNavigation();
  await Promise.resolve();
  for (const callback of afterNavigateCallbacks) callback();
}
