import { Mesh, OrthographicCamera, PlaneGeometry, Scene, Vector2, WebGLRenderer } from "three";
import { createEditorialLightMaterial } from "./editorial-light-material.ts";

/**
 * A full-bleed field of light, shadow and grain. It is purely decorative: every word on the
 * page stays in HTML, and the static SVG underneath carries the same composition when this
 * never mounts.
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
    // Buffer allocation clears the canvas: resize only immediately before drawing the next frame.
    renderer.setSize(width, height, false);
    const ratio = width / height;
    uniforms.aspect.value.set(Math.max(1, ratio), Math.max(1, 1 / ratio));
    scrollPending = true;
  };

  // The weather palette is read from the theme, so the whole of it is refreshed together.
  const theme = () => setTheme(document.documentElement.dataset.theme === "dark");

  /** Without a hovering pointer the reader's scroll carries the light instead. */
  let guidedUntil = 0;
  let progress = 0;

  const scrolled = () => {
    scrollPending = true;
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !pointer.matches) return;
    target.set(event.clientX / width, 1 - event.clientY / height);
    // The cursor is the light, so it stays where the reader parked it rather than wandering off
    // again a moment later. The drift is for a page nobody is pointing at.
    guidedUntil = performance.now() + 9000;
  };

  const leave = () => {
    guidedUntil = 0;
  };

  /** A slow, uneven figure so the drift never reads as a repeating loop. */
  const drift = (seconds: number) => {
    target.set(
      0.5 + Math.sin(seconds * 0.21) * 0.3 + Math.sin(seconds * 0.081) * 0.12,
      0.5 + Math.cos(seconds * 0.147) * 0.26 + Math.sin(seconds * 0.063) * 0.1,
    );
  };

  /*
   * On a touch screen the light answers the page rather than the finger: reading downwards walks
   * the sun across and down the frame. A slow figure is added so it still breathes while the page
   * is held still, and it is small enough that scrolling always reads as the cause.
   */
  const sweep = (seconds: number) => {
    target.set(
      0.5 + Math.sin(progress * 2.4 - 0.7) * 0.36 + Math.sin(seconds * 0.081) * 0.05,
      0.9 - progress * 0.78 + Math.cos(seconds * 0.063) * 0.04,
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
      uniforms.time.value = elapsed;
      if (!pointer.matches) sweep(elapsed);
      else if (now > guidedUntil) drift(elapsed);
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
