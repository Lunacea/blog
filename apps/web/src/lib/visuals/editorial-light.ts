import { Mesh, OrthographicCamera, PlaneGeometry, Scene, Vector2, WebGLRenderer } from "three";
import { siteConfig } from "@lunacea/config";
import { createAmbientPulses, type PulseKind } from "./ambient-pulses.ts";
import { createEditorialLightMaterial } from "./editorial-light-material.ts";
import { createLightPath } from "./light-path.ts";
import { createDaylight } from "./sunlight.ts";
import type { WeatherVisualCondition, WeatherVisualIntensity } from "./weather-visual.ts";

/** シェーダー内の流れの速さ。1 では木漏れ日の斑が一目盛り動くのに1分以上かかり、止まって見える。 */
const FLOW = 1.8;

export type EditorialLightOptions = {
  /** 開発時の確認用。待機中の出来事をこの種類に固定する。 */
  pulse?: PulseKind;
  /** 開発時の確認用。時刻の光をこの日時で描く。 */
  time?: Date;
};

/**
 * 光と影とグレインの全面背景。純粋な装飾で、これが載らない場合は下の静的 SVG が同じ構図を担う。
 * ここは描画とイベントの接続だけを受け持ち、光の行き先（light-path）、待機中の出来事
 * （ambient-pulses）、時刻の光（sunlight）はそれぞれの状態に任せる。
 */
export function mountEditorialLight(
  host: HTMLElement,
  failure: () => void,
  options: EditorialLightOptions = {},
) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0, 0);
  const high = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) >= 8;
  renderer.setPixelRatio(Math.min(devicePixelRatio, finePointer ? (high ? 1.5 : 1.2) : 1));
  renderer.domElement.className = "absolute inset-0 size-full pointer-events-none";
  host.appendChild(renderer.domElement);

  const light = createEditorialLightMaterial(!finePointer);
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, light.material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const path = createLightPath({ finePointer });
  const pulses = createAmbientPulses({ forced: options.pulse });
  const { latitude, longitude } = siteConfig.defaultLocation;
  const daylight = createDaylight(latitude, longitude, () => options.time ?? new Date());
  const target = new Vector2();

  let active = false;
  let destroyed = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let width = 1;
  let height = 1;
  let resizePending = true;
  let scrollPending = true;
  /*
   * テーマの溶暗中は画面全体の合成と重なるため描画を止める。止める前に新しいテーマで1枚だけ
   * 描き、溶暗の下から現れる背景を新しい色にしておく。色の読み出しも次のフレームまで遅らせ、
   * 切り替え処理の途中でスタイル再計算を強制しない。
   */
  let themePending = true;

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
    light.uniforms.aspect.value.set(Math.max(1, ratio), Math.max(1, 1 / ratio));
    scrollPending = true;
  };

  const render = (now: number) => {
    if (!active || destroyed) return;
    try {
      if (resizePending) resize();
      if (scrollPending) {
        scrollPending = false;
        const range = Math.max(1, document.documentElement.scrollHeight - height);
        path.scrolled(now, Math.min(1, Math.max(0, scrollY / range)));
      }
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (themePending) {
        themePending = false;
        light.setTheme(document.documentElement.dataset.theme === "dark");
      } else if (document.documentElement.dataset.themeTransition === "active") {
        frame = requestAnimationFrame(render);
        return;
      }
      elapsed += delta;
      light.uniforms.time.value = elapsed * FLOW;
      const [x, y] = path.update(elapsed, now, delta);
      light.setPulses(pulses.update(now, path.idle(now)));
      light.setDaylight(daylight.update(now, delta));
      light.uniforms.light.value.lerp(
        target.set(x, y),
        1 - Math.exp(-delta * path.followRate),
      );
      renderer.render(scene, camera);
    } catch {
      failure();
      return;
    }
    frame = requestAnimationFrame(render);
  };

  const events = new AbortController();
  const { signal } = events;
  addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || !finePointer) return;
    path.pointer(event.clientX / width, 1 - event.clientY / height, performance.now());
  }, { passive: true, signal });
  addEventListener("scroll", () => {
    scrollPending = true;
  }, { passive: true, signal });
  document.addEventListener("pointerleave", () => path.leave(), { signal });
  globalThis.addEventListener("lunacea:theme", () => {
    themePending = true;
  }, { signal });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    failure();
  }, { signal });
  const observer = new ResizeObserver(() => {
    resizePending = true;
  });
  observer.observe(host);
  path.scrolled(performance.now(), 0);

  return {
    setCondition(condition: WeatherVisualCondition, intensity?: WeatherVisualIntensity) {
      pulses.setCondition(condition);
      light.setCondition(condition, intensity);
    },
    resume(value: boolean) {
      if (value === active || destroyed) return;
      active = value;
      cancelAnimationFrame(frame);
      host.dataset.rendering = value ? "active" : "paused";
      if (!active) return;
      last = performance.now();
      pulses.reset(last);
      frame = requestAnimationFrame(render);
    },
    destroy() {
      destroyed = true;
      active = false;
      cancelAnimationFrame(frame);
      events.abort();
      observer.disconnect();
      geometry.dispose();
      light.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.rendering;
    },
  };
}
