/** 追従の時定数（秒）。小さいほど指に近い。 */
const INERTIA = 0.11;

function normalise(event: WheelEvent) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * innerHeight;
  return event.deltaY;
}

/** ホイールの下に自前で動く面があるなら、そちらに譲る。 */
function nested(node: EventTarget | null, delta: number) {
  let element = node instanceof Element ? node : null;
  while (element && element !== document.body) {
    if (element.scrollHeight > element.clientHeight) {
      const flow = getComputedStyle(element).overflowY;
      if (flow === "auto" || flow === "scroll") {
        const room = delta > 0
          ? element.scrollHeight - element.clientHeight - element.scrollTop
          : element.scrollTop;
        if (room > 1) return true;
      }
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * ホイールが要求した位置へ、地を慣性で追わせる。
 *
 * 位置そのものはブラウザに持たせたまま毎フレーム置き直すので、固定・粘着の要素も
 * 読み取り位置も素のスクロールと同じに保たれる。端を越えた分は捨てる。
 */
export function installScrollInertia() {
  const root = document.documentElement;
  let target = scrollY;
  let current = scrollY;
  let frame = 0;
  let last = 0;

  function step(now: number) {
    const delta = Math.min(last ? (now - last) / 1000 : 0, 0.05);
    last = now;
    /* 目次やキーボードで外から動かされたら、争わずにそこへ合わせる。 */
    if (Math.abs(scrollY - current) > 2) current = target = scrollY;
    current += (target - current) * (1 - Math.exp(-delta / INERTIA));
    if (Math.abs(target - current) < 0.5) current = target;
    scrollTo({ top: current, behavior: "instant" });
    if (current === target) {
      frame = 0;
      last = 0;
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function wheel(event: WheelEvent) {
    if (root.dataset.motion !== "full" || event.ctrlKey || event.defaultPrevented) return;
    const delta = normalise(event);
    if (!delta || nested(event.target, delta)) return;
    event.preventDefault();
    /* 止まっている間に外から動かされているかもしれないので、掴み直してから足す。 */
    if (!frame) {
      current = target = scrollY;
      last = 0;
      frame = requestAnimationFrame(step);
    }
    target = Math.max(0, Math.min(root.scrollHeight - innerHeight, target + delta));
  }

  addEventListener("wheel", wheel, { passive: false });
  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    removeEventListener("wheel", wheel);
  };
}
