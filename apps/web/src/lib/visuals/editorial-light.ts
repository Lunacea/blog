import { Mesh, OrthographicCamera, PlaneGeometry, Scene, Vector2, WebGLRenderer } from "three";
import { siteConfig } from "@lunacea/config";
import { createEditorialLightMaterial } from "./editorial-light-material.ts";
import { type Sunlight, sunlight } from "./sunlight.ts";
import type { WeatherVisualCondition, WeatherVisualIntensity } from "./weather-visual.ts";

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

  /*
   * テーマの溶暗中は画面全体の合成と重なるため描画を止める。止める前に新しいテーマで
   * 1枚だけ描き、溶暗の下から現れる背景を新しい色にしておく。色の読み出しも次のフレームまで
   * 遅らせ、切り替え処理の途中でスタイル再計算を強制しない。
   */
  let themePending = true;
  const theme = () => {
    themePending = true;
  };

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
  type PulseKind = "bloom" | "veil" | "clearing" | "ripple" | "gust";
  type Pulse = {
    kind: PulseKind;
    start: number;
    duration: number;
    strength: number;
    size: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  };
  /*
   * 天候に合う出来事を多めに選ぶ。晴れは光が開き、曇りは雲影が渡るか雲間から光が差し、
   * 雨は水面が揺れ、雪は雪煙が流れる。
   */
  const moods: Record<WeatherVisualCondition, Array<[PulseKind, number]>> = {
    clear: [["bloom", 0.65], ["veil", 0.35]],
    neutral: [["bloom", 0.4], ["veil", 0.35], ["clearing", 0.25]],
    cloudy: [["veil", 0.45], ["clearing", 0.4], ["bloom", 0.15]],
    rain: [["ripple", 0.75], ["veil", 0.25]],
    snow: [["gust", 0.7], ["veil", 0.3]],
  };
  let condition: WeatherVisualCondition = "neutral";
  let pulse: Pulse | undefined;
  let nextPulse = performance.now() + 3000 + Math.random() * 4000;
  const between = (low: number, high: number) => low + Math.random() * (high - low);
  const pick = (): PulseKind => {
    const choices = moods[condition] ?? moods.neutral;
    let roll = Math.random();
    for (const [kind, weight] of choices) {
      roll -= weight;
      if (roll <= 0) return kind;
    }
    return choices[0][0];
  };
  const spawn = (now: number): Pulse => {
    const kind = pick();
    const start = { kind, start: now, size: 0.66 };
    const at = { fromX: between(0.18, 0.82), fromY: between(0.2, 0.8), toX: 0, toY: 0 };
    if (kind === "bloom") {
      return { ...start, ...at, duration: between(4500, 7000), strength: between(0.55, 1) };
    }
    if (kind === "ripple") {
      return { ...start, ...at, duration: between(5000, 7000), strength: between(0.6, 1) };
    }
    // 移ろう効果は向きを決め、雲間はその場からわずかに、雲影と雪煙は画面を横切って動く。
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    if (kind === "clearing") {
      return {
        ...start,
        ...at,
        toX: at.fromX + dx * 0.22,
        toY: at.fromY + dy * 0.16,
        duration: between(9000, 13000),
        strength: between(0.6, 1),
      };
    }
    const offset = between(-0.25, 0.25);
    const across = {
      fromX: 0.5 - dx * 0.95 - dy * offset,
      fromY: 0.5 - dy * 0.95 + dx * offset,
      toX: 0.5 + dx * 0.95 - dy * offset,
      toY: 0.5 + dy * 0.95 + dx * offset,
    };
    if (kind === "gust") {
      return { ...start, ...across, duration: between(7000, 10000), strength: between(0.6, 1) };
    }
    return {
      ...start,
      ...across,
      size: between(0.45, 0.9),
      duration: between(8000, 12000),
      strength: between(0.55, 0.9),
    };
  };
  const ambience = (now: number, idle: boolean) => {
    if (!pulse && idle && now > nextPulse) pulse = spawn(now);
    uniforms.bloom.value = 0;
    uniforms.veilStrength.value = 0;
    uniforms.ringStrength.value = 0;
    uniforms.clearing.value.z = 0;
    uniforms.gust.value.z = 0;
    if (!pulse) return;
    const t = (now - pulse.start) / pulse.duration;
    if (t >= 1) {
      pulse = undefined;
      nextPulse = now + between(5000, 12000);
      return;
    }
    const envelope = Math.sin(Math.PI * t) ** 2 * pulse.strength;
    switch (pulse.kind) {
      case "bloom":
        uniforms.bloom.value = envelope;
        return;
      case "ripple":
        // 水面の輪は落ちた瞬間に立ち、広がりながらゆっくり消える。
        uniforms.ringStrength.value = Math.min(1, t * 8) * (1 - t) ** 1.5 * pulse.strength;
        uniforms.ring.value.set(pulse.fromX, pulse.fromY, 0.04 + t * 0.95);
        return;
      case "clearing":
        uniforms.clearing.value.set(
          pulse.fromX + (pulse.toX - pulse.fromX) * t,
          pulse.fromY + (pulse.toY - pulse.fromY) * t,
          envelope,
        );
        return;
      case "gust":
        uniforms.gust.value.set(
          pulse.fromX + (pulse.toX - pulse.fromX) * t,
          pulse.fromY + (pulse.toY - pulse.fromY) * t,
          envelope,
        );
        return;
      case "veil":
        uniforms.veilStrength.value = envelope;
        uniforms.veilSize.value = pulse.size;
        uniforms.veil.value.set(
          pulse.fromX + (pulse.toX - pulse.fromX) * t,
          pulse.fromY + (pulse.toY - pulse.fromY) * t,
        );
    }
  };

  /*
   * 地点の時刻による光。太陽はゆっくりしか動かないので1分ごとに求め、その間はなめらかに寄せる。
   * 最初の1回だけは寄せずに置き、読み込み直後に夕暮れへ染まっていく動きを見せない。
   */
  const { latitude, longitude } = siteConfig.defaultLocation;
  let sky: Sunlight | undefined;
  let nextSky = 0;
  const daylight = (now: number, delta: number) => {
    if (now >= nextSky) {
      nextSky = now + 60_000;
      const first = !sky;
      sky = sunlight(new Date(), latitude, longitude);
      if (first) {
        uniforms.dusk.value = sky.dusk;
        uniforms.night.value = sky.night;
        uniforms.sunSide.value = sky.side;
        uniforms.sunLow.value = sky.low;
      }
    }
    if (!sky) return;
    const ease = 1 - Math.exp(-delta * 0.4);
    uniforms.dusk.value += (sky.dusk - uniforms.dusk.value) * ease;
    uniforms.night.value += (sky.night - uniforms.night.value) * ease;
    uniforms.sunSide.value += (sky.side - uniforms.sunSide.value) * ease;
    uniforms.sunLow.value += (sky.low - uniforms.sunLow.value) * ease;
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
      if (themePending) {
        themePending = false;
        setTheme(document.documentElement.dataset.theme === "dark");
      } else if (document.documentElement.dataset.themeTransition === "active") {
        frame = requestAnimationFrame(render);
        return;
      }
      elapsed += delta;
      uniforms.time.value = elapsed * FLOW;
      if (!pointer.matches) sweep(elapsed, now, delta);
      else if (now > guidedUntil) drift(elapsed);
      ambience(now, pointer.matches ? now > guidedUntil : calm > 0.5);
      daylight(now, delta);
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
  scrolled();

  return {
    setCondition(next: WeatherVisualCondition, intensity?: WeatherVisualIntensity) {
      condition = next;
      setCondition(next, intensity);
    },
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
