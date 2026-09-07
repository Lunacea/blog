import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import type { WeatherVisualCondition } from "./weather-visual.ts";

/**
 * A full-bleed field of light, shadow and grain. It is purely decorative: every word on the
 * page stays in HTML, and the static SVG underneath carries the same composition when this
 * never mounts.
 */
export function mountEditorialLight(host: HTMLElement, failure: () => void) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0, 0);
  const high = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) >= 8;
  renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 1.5 : 1.2));
  renderer.domElement.className = "absolute inset-0 size-full pointer-events-none";
  host.appendChild(renderer.domElement);

  const uniforms = {
    light: { value: new Vector2(0.32, 0.72) },
    aspect: { value: new Vector2(1, 1) },
    time: { value: 0 },
    dark: { value: 0 },
    cloud: { value: 0.45 },
    /* Signed exposure: overcast and rain sit below the resting level, snow above it. */
    lift: { value: 0 },
    /* How much of the light arrives as directional shafts rather than flat veil. */
    shaft: { value: 0.5 },
    /* Vertical stretch of the noise: rain reads as streaks without anything falling. */
    streak: { value: 0 },
    /* Fine high-frequency lift: the flat glare of snow. */
    sparkle: { value: 0 },
  };

  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    uniforms,
    vertexShader: `
      varying vec2 uvCoord;
      void main(){
        uvCoord = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: `
      precision highp float;
      varying vec2 uvCoord;
      uniform vec2 light, aspect;
      uniform float time, dark, cloud, lift, shaft, streak, sparkle;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      float valueNoise(vec2 p){
        vec2 cell = floor(p);
        vec2 part = fract(p);
        vec2 blend = part * part * (3.0 - 2.0 * part);
        float a = hash(cell);
        float b = hash(cell + vec2(1.0, 0.0));
        float c = hash(cell + vec2(0.0, 1.0));
        float d = hash(cell + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      mat2 turn(float angle){
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      /* Each octave is rotated, so the value-noise grid never lines up into visible tiers. */
      float fbm(vec2 p){
        float sum = 0.0;
        float weight = 0.5;
        mat2 spin = turn(0.73);
        for (int i = 0; i < 5; i++) {
          sum += weight * valueNoise(p);
          p = spin * p * 2.07 + 13.1;
          weight *= 0.5;
        }
        return sum;
      }

      void main(){
        /*
         * The pointer sets the direction light falls from, never a point: a radial term is what
         * drew concentric rings across the page. Everything else is noise.
         */
        vec2 fall = normalize(light - vec2(0.5, 0.5) + vec2(0.0001));
        vec2 across = vec2(-fall.y, fall.x);
        vec2 frame = uvCoord * aspect;
        float span = dot(uvCoord - vec2(0.5, 0.5), fall);
        float gradient = smoothstep(0.62, -0.58, span);

        /* Rain stretches the noise downward; nothing is ever drawn falling. */
        vec2 stretch = vec2(1.0, mix(1.0, 0.28, streak));

        /* Long thin breaks along the light: the shafts between the branches. */
        float lateral = dot(uvCoord - vec2(0.5, 0.5), across);
        float shafts = fbm(vec2(lateral * 7.8, span * 1.4 + time * 0.02));

        /* A canopy over them: high-contrast gaps that scatter the shafts into patches. */
        float canopy = fbm(frame * vec2(4.4, 3.7) * stretch + vec2(time * 0.014, -time * 0.009));
        float gaps = smoothstep(0.34, 0.78, canopy);

        /* Cloud cover only ever closes the canopy further. */
        float overcast = fbm(frame * vec2(1.8, 1.3) * stretch + vec2(time * 0.008, time * 0.004));
        float occlusion = mix(1.0, 0.24 + 0.76 * smoothstep(0.3, 0.74, overcast), cloud);

        float dapple = mix(1.0, mix(0.22, 1.0, gaps) * mix(0.5, 1.0, shafts), shaft);
        float glare = sparkle * fbm(frame * 14.0 + vec2(time * 0.02, 0.0)) * 0.34;
        float ambient = fbm(frame * vec2(1.0, 0.75) - vec2(time * 0.005, time * 0.003));

        float signal = gradient * dapple * occlusion * 1.45 + ambient * 0.2 + glare - 0.42 + lift;

        /* Continuous on both sides of the crossing, so no tier ever draws an edge. */
        float glow = smoothstep(0.0, 0.6, signal);
        float shade = smoothstep(0.0, 0.42, -signal);
        vec3 tone = mix(vec3(0.0), vec3(1.0), step(0.0, signal));
        float grain = (hash(gl_FragCoord.xy + fract(time * 0.7) * vec2(37.0, 17.0)) - 0.5) * 0.045;
        float alpha = glow * mix(0.26, 0.46, dark) + shade * mix(0.3, 0.26, dark) + grain * glow;
        gl_FragColor = vec4(tone, clamp(alpha, 0.0, 1.0));
      }`,
  });

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

  const resize = () => {
    if (destroyed) return;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    const ratio = bounds.width / bounds.height;
    uniforms.aspect.value.set(Math.max(1, ratio), Math.max(1, 1 / ratio));
  };

  const theme = () => {
    uniforms.dark.value = document.documentElement.dataset.theme === "dark" ? 1 : 0;
  };

  /** Without a hovering pointer the light drifts on its own, so the field still breathes. */
  const guided = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  let guidedUntil = 0;

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !guided()) return;
    const bounds = host.getBoundingClientRect();
    target.set(
      (event.clientX - bounds.left) / bounds.width,
      1 - (event.clientY - bounds.top) / bounds.height,
    );
    guidedUntil = performance.now() + 4000;
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

  const render = (now: number) => {
    if (!active || destroyed) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;
    uniforms.time.value = elapsed;
    if (!guided() || now > guidedUntil) drift(elapsed);
    uniforms.light.value.lerp(target, 1 - Math.exp(-delta * (guided() ? 3.4 : 1.1)));
    try {
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

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerleave", leave);
  globalThis.addEventListener("lunacea:theme", theme);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  theme();

  return {
    setCondition(condition: WeatherVisualCondition) {
      // Weather reads only as light: open sun, a flat veil, deeper shade, or a bright whiteout.
      type Sky = { cloud: number; lift: number; shaft: number; streak: number; sparkle: number };
      const skies: Record<WeatherVisualCondition, Sky> = {
        /* Open sun: hard dappled shafts through the canopy. */
        clear: { cloud: 0.02, lift: 0.06, shaft: 1, streak: 0, sparkle: 0 },
        neutral: { cloud: 0.45, lift: 0, shaft: 0.5, streak: 0, sparkle: 0 },
        /* A flat veil: the shafts close up and the whole frame steps down. */
        cloudy: { cloud: 0.8, lift: -0.07, shaft: 0.12, streak: 0, sparkle: 0 },
        /* Deep shade, and the noise stretched downward into streaks. */
        rain: { cloud: 0.95, lift: -0.17, shaft: 0.05, streak: 1, sparkle: 0 },
        /* A bright, low-contrast whiteout with fine glare over it. */
        snow: { cloud: 0.68, lift: 0.16, shaft: 0.2, streak: 0, sparkle: 1 },
      };
      const sky = skies[condition] ?? skies.neutral;
      uniforms.cloud.value = sky.cloud;
      uniforms.lift.value = sky.lift;
      uniforms.shaft.value = sky.shaft;
      uniforms.streak.value = sky.streak;
      uniforms.sparkle.value = sky.sparkle;
    },
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
