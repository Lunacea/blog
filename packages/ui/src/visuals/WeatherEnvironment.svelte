<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
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
  const uniforms = {
    uTime: { value: 0 },
    uDensity: { value: untrack(() => quality === "high" ? 1 : .72) },
    uWeather: { value: weights },
    uForeground: { value: new Color(untrack(() => palette.foreground)) },
    uPrimary: { value: new Color(untrack(() => palette.primary)) },
    uAccent: { value: new Color(untrack(() => palette.accent)) },
  };

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

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = .5;
      mat2 rotation = mat2(.8, -.6, .6, .8);
      for (int octave = 0; octave < 5; octave++) {
        value += noise(p) * amplitude;
        p = rotation * p * 2.04 + 11.7;
        amplitude *= .5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      float phase = uTime * 6.28318530718;
      vec2 lightUv = uv - vec2(.1, .95);
      lightUv.x += lightUv.y * .62;
      float canopy = fbm(uv * vec2(5.0, 3.0) + vec2(phase * .08, -phase * .03));
      float rayBands = pow(max(0.0, sin((lightUv.x + sin(phase * .35) * .025) * 31.0)), 7.0);
      float rayEnvelope = smoothstep(.0, .22, uv.y) * smoothstep(1.08, .38, uv.y);
      float clear = rayBands * rayEnvelope * smoothstep(.34, .78, canopy) * .24;
      clear += smoothstep(.82, .03, length(lightUv * vec2(.72, 1.0))) * .07;

      vec2 fogUv = uv * vec2(2.6, 1.7);
      fogUv += vec2(phase * .035, sin(phase * .4) * .08);
      float fogNear = fbm(fogUv * 1.7);
      float fogFar = fbm(fogUv * .82 - vec2(phase * .025, 0.0));
      float cloudy = smoothstep(.32, .78, fogNear * .62 + fogFar * .55);
      cloudy *= (.07 + smoothstep(.0, .7, uv.y) * .09);

      vec2 rainGrid = vec2(19.0 * uDensity, 12.0 * uDensity);
      vec2 rainCell = floor(uv * rainGrid);
      vec2 rainUv = fract(uv * rainGrid) - .5;
      float rainSeed = hash(rainCell);
      rainUv += vec2(hash(rainCell + 2.7) - .5, hash(rainCell + 8.1) - .5) * .36;
      rainUv.y *= .72 + rainSeed * .58;
      float rainLife = .5 - .5 * cos(phase + rainSeed * 6.28318530718);
      float dropRadius = mix(.018, .105, smoothstep(.05, .75, rainLife));
      float dropDistance = length(rainUv);
      float rainRing = smoothstep(dropRadius + .014, dropRadius, dropDistance) -
        smoothstep(dropRadius, dropRadius - .018, dropDistance);
      float rainHighlight = smoothstep(.035, .0, length(rainUv - vec2(-.026, .03)));
      float streamX = abs(fract(uv.x * 23.0 + rainSeed) - .5);
      float streamLife = smoothstep(.7, .12, fract(uv.y * .85 - uTime * (1.2 + rainSeed)));
      float stream = smoothstep(.028, .006, streamX) * streamLife * step(.84, rainSeed);
      float rain = (rainRing * .16 + rainHighlight * .1) * step(.34, rainSeed) + stream * .045;

      vec2 snowGrid = vec2(16.0 * uDensity, 12.0 * uDensity);
      vec2 snowCell = floor(uv * snowGrid);
      vec2 snowUv = fract(uv * snowGrid) - .5;
      float snowSeed = hash(snowCell);
      float snowCycles = 1.0 + floor(snowSeed * 3.0);
      snowUv.y = fract(snowUv.y + uTime * snowCycles * .72) - .5;
      snowUv.x += sin(phase * (.3 + snowSeed) + snowSeed * 18.0) * .16;
      float flakeCore = abs(snowUv.x) + abs(snowUv.y);
      float flake = 1.0 - smoothstep(.014, .052 + snowSeed * .018, flakeCore);
      float sparkle = pow(max(0.0, sin(phase * 2.0 + snowSeed * 30.0)), 8.0);
      float snowfall = flake * step(.3, snowSeed) * (.14 + sparkle * .08);
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

  $effect(() => {
    uniforms.uForeground.value.set(palette.foreground);
    uniforms.uPrimary.value.set(palette.primary);
    uniforms.uAccent.value.set(palette.accent);
  });

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
    {uniforms}
    {vertexShader}
    {fragmentShader}
    transparent
    depthWrite={false}
  />
</T.Mesh>
