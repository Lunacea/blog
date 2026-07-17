<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { T, useTask } from "@threlte/core";
  import { Color, PlaneGeometry, type ShaderMaterial, Vector4 } from "three";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let {
    quality,
    palette,
    condition,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
    condition: WeatherVisualCondition;
  } = $props();

  const geometry = new PlaneGeometry(2, 2);
  let material = $state<ShaderMaterial>();
  let running = $state(true);
  let elapsed = 0;
  const loopDuration = 32;
  const weights = new Vector4();

  function target(value: WeatherVisualCondition): [number, number, number, number] {
    if (value === "clear") return [1, 0, 0, 0];
    if (value === "cloudy") return [0, 1, 0, 0];
    if (value === "rain") return [0, 0, 1, 0];
    if (value === "snow") return [0, 0, 0, 1];
    return [0, 0, 0, 0];
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uDensity;
    uniform vec4 uWeather;
    uniform vec3 uForeground;
    uniform vec3 uPrimary;
    uniform vec3 uAccent;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float phase = uTime * 6.28318530718;
      float lightDrift = sin(phase + uv.y * 2.2) * .035;
      float rayBands = pow(max(0.0, sin((uv.x + uv.y * .2 + lightDrift) * 24.0)), 4.0);
      float rayEnvelope = smoothstep(.05, .42, uv.y) * smoothstep(1.05, .5, uv.y);
      float leafLight = .72 + .28 * sin(uv.x * 17.0 + sin(uv.y * 11.0 + phase) * 1.7);
      float clear = rayBands * rayEnvelope * leafLight * .16;
      clear += smoothstep(.76, .08, distance(uv, vec2(.28 + sin(phase) * .025, .9))) * .055;

      float fogA = sin(uv.x * 5.2 + phase) + sin(uv.y * 4.0 - phase);
      float fogB = sin((uv.x + uv.y) * 7.0 + phase * .5);
      float fogC = sin(uv.x * 11.0 - uv.y * 3.0 - phase);
      float cloudy = smoothstep(-.35, 1.65, fogA * .48 + fogB * .32 + fogC * .2);
      cloudy *= smoothstep(.02, .28, uv.y) * .105;

      vec2 rainGrid = vec2(16.0 * uDensity, 10.0 * uDensity);
      vec2 rainCell = floor(uv * rainGrid);
      vec2 rainUv = fract(uv * rainGrid) - .5;
      float rainSeed = hash(rainCell);
      rainUv += vec2(hash(rainCell + 2.7) - .5, hash(rainCell + 8.1) - .5) * .36;
      rainUv.y *= .78 + rainSeed * .5;
      float rainLife = .5 - .5 * cos(phase + rainSeed * 6.28318530718);
      float dropRadius = mix(.018, .09, smoothstep(.05, .75, rainLife));
      float dropDistance = length(rainUv);
      float rainRing = smoothstep(dropRadius + .014, dropRadius, dropDistance) -
        smoothstep(dropRadius, dropRadius - .018, dropDistance);
      float rainHighlight = smoothstep(.035, .0, length(rainUv - vec2(-.026, .03)));
      float rain = (rainRing * .13 + rainHighlight * .08) * step(.38, rainSeed);

      vec2 snowGrid = vec2(12.0 * uDensity, 9.0 * uDensity);
      vec2 snowCell = floor(uv * snowGrid);
      vec2 snowUv = fract(uv * snowGrid) - .5;
      float snowSeed = hash(snowCell);
      float snowCycles = 1.0 + floor(snowSeed * 2.0);
      snowUv.y = fract(snowUv.y + uTime * snowCycles) - .5;
      snowUv.x += sin(phase + snowSeed * 6.28) * .11;
      float flake = 1.0 - smoothstep(.012, .034 + snowSeed * .012, abs(snowUv.x) + abs(snowUv.y));
      float snowfall = flake * step(.48, snowSeed) * .16;
      float snowGrowth = .5 - .5 * cos(phase);
      float snowLine = .035 + snowGrowth * .045 + sin(uv.x * 18.0 + phase * .25) * .009;
      float snowBank = smoothstep(snowLine, snowLine - .018, uv.y) * .11;
      float snow = snowfall + snowBank;

      vec3 color = uAccent * clear * uWeather.x;
      color += uPrimary * cloudy * uWeather.y;
      color += mix(uPrimary, uForeground, .72) * rain * uWeather.z;
      color += uForeground * snow * uWeather.w;
      float alpha = clear * uWeather.x + cloudy * uWeather.y + rain * uWeather.z + snow * uWeather.w;
      gl_FragColor = vec4(color, clamp(alpha, 0.0, .28));
    }
  `;

  useTask((delta) => {
    if (!material) return;
    elapsed += Math.min(delta, .05);
    const next = target(condition);
    const blend = 1 - Math.exp(-delta * 2.4);
    weights.x += (next[0] - weights.x) * blend;
    weights.y += (next[1] - weights.y) * blend;
    weights.z += (next[2] - weights.z) * blend;
    weights.w += (next[3] - weights.w) * blend;
    material.uniforms.uTime.value = (elapsed % loopDuration) / loopDuration;
    material.uniforms.uWeather.value.copy(weights);
  }, { running: () => running });

  onMount(() => {
    const update = () => {
      running = !document.hidden && document.documentElement.dataset.motion === "full";
    };
    document.addEventListener("visibilitychange", update);
    addEventListener("lunacea:motion", update);
    update();
    return () => {
      document.removeEventListener("visibilitychange", update);
      removeEventListener("lunacea:motion", update);
    };
  });

  onDestroy(() => geometry.dispose());
</script>

<T.Mesh {geometry} position={[0, 0, -2.4]} scale={[5.2, 3.4, 1]}>
  <T.ShaderMaterial
    bind:ref={material}
    uniforms={{
      uTime: { value: 0 },
      uDensity: { value: quality === "high" ? 1 : .65 },
      uWeather: { value: weights },
      uForeground: { value: new Color(palette.foreground) },
      uPrimary: { value: new Color(palette.primary) },
      uAccent: { value: new Color(palette.accent) },
    }}
    {vertexShader}
    {fragmentShader}
    transparent
    depthWrite={false}
  />
</T.Mesh>
