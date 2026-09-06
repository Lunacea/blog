<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let colorProbe: HTMLSpanElement;

  onMount(() => {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    let seed = 0x697bea;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    // Populate the full viewing volume before the first paint. No shared rows,
    // tiled textures, or emitter filling the screen from the top after startup.
    const drops = Array.from({ length: 320 }, () => ({
      x: random(), y: random(), depth: random(), variation: random(),
    }));
    let width = 1;
    let height = 1;
    let count = 0;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let sprites: HTMLCanvasElement[] = [];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const forced = matchMedia("(forced-colors: active)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    function makeSprites() {
      const color = getComputedStyle(colorProbe).color;
      sprites = [0, 1, 2].map((depth) => {
        const sprite = document.createElement("canvas");
        sprite.width = 12;
        sprite.height = 64;
        const brush = sprite.getContext("2d")!;
        // Finite exposure stretches a falling drop into a feathered streak.
        // Only the nearest layer has appreciable defocus; no shaded bead icons.
        const light = brush.createLinearGradient(0, 0, 0, 64);
        light.addColorStop(0, "transparent");
        light.addColorStop(.35, color);
        light.addColorStop(.7, color);
        light.addColorStop(1, "transparent");
        brush.strokeStyle = light;
        brush.lineWidth = 1 + depth * .5;
        brush.filter = depth === 2 ? "blur(0.55px)" : "none";
        brush.beginPath();
        brush.moveTo(6, 0);
        brush.lineTo(6, 64);
        brush.stroke();
        return sprite;
      });
    }

    function paint(delta = 0) {
      context!.clearRect(0, 0, width, height);
      if (forced.matches) return;
      const wind = .10 + Math.sin(elapsed * .37) * .035;
      for (let index = 0; index < count; index++) {
        const drop = drops[index];
        const speed = 330 + drop.depth * 750;
        const slant = wind + (drop.variation - .5) * .018;
        drop.y += speed * delta / height;
        drop.x += speed * slant * delta / width;
        if (drop.y > 1.06) {
          drop.y = -.06;
          drop.x = random();
        }
        if (drop.x > 1.06) drop.x = -.06;
        // A short shutter interval, plus depth variation, gives restrained blur.
        const length = speed * (.018 + drop.variation * .012);
        const layer = Math.min(2, Math.floor(drop.depth * 3));
        context!.save();
        context!.translate(drop.x * width, drop.y * height);
        context!.rotate(-Math.atan(slant));
        context!.globalAlpha = .12 + drop.depth * .22;
        context!.drawImage(sprites[layer], -6, -length, 12, length);
        context!.restore();
      }
    }

    function animate(now: number) {
      const delta = Math.min(last ? (now - last) / 1000 : 0, .05);
      last = now;
      elapsed += delta;
      paint(delta);
      frame = requestAnimationFrame(animate);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      last = 0;
      makeSprites();
      paint();
      if (!document.hidden && !reduced.matches && !forced.matches && !connection?.saveData &&
        document.documentElement.dataset.motion === "full") {
        frame = requestAnimationFrame(animate);
      }
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      count = Math.min(drops.length, Math.max(65, Math.round(width * height / 3800)));
      refresh();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("lunacea:motion", refresh);
    window.addEventListener("lunacea:theme", refresh);
    reduced.addEventListener("change", refresh);
    forced.addEventListener("change", refresh);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("lunacea:motion", refresh);
      window.removeEventListener("lunacea:theme", refresh);
      reduced.removeEventListener("change", refresh);
      forced.removeEventListener("change", refresh);
      sprites = [];
    };
  });
</script>

<div class="weather-atmosphere pointer-events-none absolute inset-0 forced-colors:hidden print:hidden" data-condition="rain" aria-hidden="true">
  <span class="absolute size-0 overflow-hidden text-weather-rain" bind:this={colorProbe}></span>
  <canvas class="block size-full" data-precipitation="rain" bind:this={canvas}></canvas>
</div>
