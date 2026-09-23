import { Mesh, OrthographicCamera, PlaneGeometry, Scene, Vector2, WebGLRenderer } from "three";
import { createEditorialLightMaterial } from "./editorial-light-material.ts";

/** シェーダー内の流れの速さ。1 では木漏れ日の斑が一目盛り動くのに1分以上かかり、止まって見える。 */
const FLOW = 1.8;

/**
 * 光と影とグレインの全面背景。純粋な装飾で、これが載らない場合は下の静的 SVG が同じ構図を担う。
 */
export function mountEditorialLight(host: HTMLElement, failure: () => void) {
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0, 0);
  const high = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) >= 8;
  renderer.setPixelRatio(Math.min(devicePixelRatio, pointer.matches ? (high ? 1.5 : 1.2) : 1));
  renderer.domElement.className = "absolute inset-0 size-full pointer-events-none";
  host.appendChild(renderer.domElement);

  const { material, uniforms, setCondition, setTheme } = createEditorialLightMaterial(
    !pointer.matches,
  );

  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let active = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let destroyed = false;
  const target = new Vector2(0.32, 0.72);

  let width = 1;
  let height = 1;
  let resizePending = true;
  let scrollPending = true;
  const resize = () => {
    resizePending = false;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    // バッファ確保でキャンバスがクリアされるため、描画直前にだけリサイズする。
    renderer.setSize(width, height, false);
    const ratio = width / height;
    uniforms.aspect.value.set(Math.max(1, ratio), Math.max(1, 1 / ratio));
    scrollPending = true;
  };

  const theme = () => setTheme(document.documentElement.dataset.theme === "dark");

  /** ポインタがない場合はスクロールが光を運ぶ。 */
  let guidedUntil = 0;
  let progress = 0;

  const scrolled = () => {
    scrollPending = true;
    lastScroll = performance.now();
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !pointer.matches) return;
    target.set(event.clientX / width, 1 - event.clientY / height);
    // 自動ドリフトは誰もポインタを置いていないページ用。置かれた位置はそのまま保つ。
    guidedUntil = performance.now() + 9000;
  };

  const leave = () => {
    guidedUntil = 0;
  };

  /** 繰り返しに見えないよう、周期の揃わない正弦を重ねた不均等な軌跡にする。 */
  const wander = (seconds: number, scale: number) => {
    wanderX = (Math.sin(seconds * 0.31) * 0.3 + Math.sin(seconds * 0.12 + 1.1) * 0.12) * scale;
    wanderY = (Math.cos(seconds * 0.23) * 0.26 + Math.sin(seconds * 0.097 + 0.4) * 0.1) * scale;
  };
  let wanderX = 0;
  let wanderY = 0;

  const drift = (seconds: number) => {
    wander(seconds, 1);
    target.set(0.5 + wanderX, 0.5 + wanderY);
  };

  /*
   * タッチ環境では光は指ではなくページに応答する。下へ読み進めると光も動く。
   * 読んでいる間はスクロールが原因だと読める程度に揺らぎを抑え、手を止めると
   * PC の自動ドリフトに近い振れ幅までゆっくり戻す。
   */
  let lastScroll = -Infinity;
  let calm = 0;
  const sweep = (seconds: number, now: number, delta: number) => {
    const idle = now - lastScroll > 1600;
    // 静止へは数秒かけて移り、スクロール再開ではすぐ手放す。
    calm += ((idle ? 1 : 0) - calm) * (1 - Math.exp(-delta * (idle ? 0.45 : 2.4)));
    wander(seconds, 0.2 + calm * 0.6);
    target.set(
      0.5 + Math.sin(progress * 2.4 - 0.7) * 0.36 * (1 - calm * 0.35) + wanderX,
      0.9 - progress * 0.78 + wanderY,
    );
  };

  /*
   * 誰も触れていない間だけ、不規則な間隔で光が差し込んだり雲影が横切ったりする。
   * 包絡線は両端がなめらかに 0 へ着くので、途中で操作が始まっても最後まで流して終える。
   */
  type Pulse = {
    kind: "bloom" | "veil";
    start: number;
    duration: number;
    strength: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  };
  let pulse: Pulse | undefined;
  let nextPulse = performance.now() + 3000 + Math.random() * 4000;
  const between = (low: number, high: number) => low + Math.random() * (high - low);
  const spawn = (now: number): Pulse => {
    if (Math.random() < 0.5) {
      return {
        kind: "bloom",
        start: now,
        duration: between(4500, 7000),
        strength: between(0.55, 1),
        fromX: 0,
        fromY: 0,
        toX: 0,
        toY: 0,
      };
    }
    // 画面外から入り、反対側の画面外へ抜ける。
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle) * 0.95;
    const dy = Math.sin(angle) * 0.95;
    const offset = between(-0.25, 0.25);
    return {
      kind: "veil",
      start: now,
      duration: between(8000, 12000),
      strength: between(0.55, 0.9),
      fromX: 0.5 - dx - dy * offset,
      fromY: 0.5 - dy + dx * offset,
      toX: 0.5 + dx - dy * offset,
      toY: 0.5 + dy + dx * offset,
    };
  };
  const ambience = (now: number, idle: boolean) => {
    if (!pulse && idle && now > nextPulse) pulse = spawn(now);
    uniforms.bloom.value = 0;
    uniforms.veilStrength.value = 0;
    if (!pulse) return;
    const t = (now - pulse.start) / pulse.duration;
    if (t >= 1) {
      pulse = undefined;
      nextPulse = now + between(5000, 12000);
      return;
    }
    const envelope = Math.sin(Math.PI * t) ** 2 * pulse.strength;
    if (pulse.kind === "bloom") {
      uniforms.bloom.value = envelope;
      return;
    }
    uniforms.veilStrength.value = envelope;
    uniforms.veil.value.set(
      pulse.fromX + (pulse.toX - pulse.fromX) * t,
      pulse.fromY + (pulse.toY - pulse.fromY) * t,
    );
  };

  const render = (now: number) => {
    if (!active || destroyed) return;
    try {
      if (resizePending) resize();
      if (scrollPending) {
        scrollPending = false;
        const range = Math.max(1, document.documentElement.scrollHeight - height);
        progress = Math.min(1, Math.max(0, scrollY / range));
      }
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += delta;
      uniforms.time.value = elapsed * FLOW;
      if (!pointer.matches) sweep(elapsed, now, delta);
      else if (now > guidedUntil) drift(elapsed);
      ambience(now, pointer.matches ? now > guidedUntil : calm > 0.5);
      uniforms.light.value.lerp(target, 1 - Math.exp(-delta * (pointer.matches ? 3.4 : 2.2)));
      renderer.render(scene, camera);
    } catch {
      failure();
      return;
    }
    frame = requestAnimationFrame(render);
  };

  const lost = (event: Event) => {
    event.preventDefault();
    failure();
  };

  const observer = new ResizeObserver(() => {
    resizePending = true;
  });
  observer.observe(host);
  addEventListener("pointermove", move, { passive: true });
  addEventListener("scroll", scrolled, { passive: true });
  document.addEventListener("pointerleave", leave);
  globalThis.addEventListener("lunacea:theme", theme);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  theme();
  scrolled();

  return {
    setCondition,
    resume(value: boolean) {
      if (value === active || destroyed) return;
      active = value;
      cancelAnimationFrame(frame);
      host.dataset.rendering = value ? "active" : "paused";
      if (active) {
        last = performance.now();
        // 止まっていた間の時間で包絡線が跳ばないよう、途中の効果は捨てて改めて待つ。
        pulse = undefined;
        nextPulse = last + between(3000, 7000);
        frame = requestAnimationFrame(render);
      }
    },
    destroy() {
      destroyed = true;
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("pointermove", move);
      removeEventListener("scroll", scrolled);
      document.removeEventListener("pointerleave", leave);
      globalThis.removeEventListener("lunacea:theme", theme);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.rendering;
    },
  };
}
