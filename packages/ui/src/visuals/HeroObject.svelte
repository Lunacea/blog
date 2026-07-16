<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { T, useTask } from "@threlte/core";
  import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, type Points, type ShaderMaterial } from "three";
  import { createHeroShapePositions } from "./hero-geometry.ts";

  let { quality, palette, scrubPhase = null, yaw = 0, pitch = 0, scale = 1, offsetY = 0, paused = false }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
    scrubPhase?: number | null;
    yaw?: number;
    pitch?: number;
    scale?: number;
    offsetY?: number;
    paused?: boolean;
  } = $props();

  const count = untrack(() => quality === "high" ? 2400 : 900);
  const positions = createHeroShapePositions(count);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions.mobius, 3));
  geometry.setAttribute("aSphere", new Float32BufferAttribute(positions.sphere, 3));
  geometry.setAttribute("aOctahedron", new Float32BufferAttribute(positions.octahedron, 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(positions.seeds, 1));

  const vertexShader = `
    uniform float uShape;
    uniform float uMorph;
    uniform float uSeparate;
    uniform float uTime;
    attribute vec3 aSphere;
    attribute vec3 aOctahedron;
    attribute float aSeed;
    varying float vSeed;
    vec3 shape(float index) {
      if (index < 0.5) return position;
      if (index < 1.5) return aSphere;
      return aOctahedron;
    }
    void main() {
      vec3 from = shape(uShape);
      vec3 to = shape(mod(uShape + 1.0, 3.0));
      vec3 transformed = mix(from, to, smoothstep(0.0, 1.0, uMorph));
      vec3 direction = normalize(transformed + vec3(aSeed - .5, .25 - aSeed, aSeed * .5));
      transformed += direction * uSeparate * (.22 + aSeed * .62);
      transformed += direction * sin(uTime * .7 + aSeed * 18.0) * .012;
      vec4 view = modelViewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * view;
      gl_PointSize = (2.2 + aSeed * 2.0) * (5.0 / max(2.0, -view.z));
      vSeed = aSeed;
    }
  `;
  const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uSignal;
    varying float vSeed;
    void main() {
      vec2 point = gl_PointCoord - .5;
      if (dot(point, point) > .25) discard;
      vec3 color = mix(uColor, uSignal, step(.82, vSeed));
      gl_FragColor = vec4(color, .34 + vSeed * .46);
    }
  `;

  let points = $state<Points>();
  let material = $state<ShaderMaterial>();
  let running = $state(true);
  let elapsed = 0;
  const hold = 3.2;
  const separate = 0.6;
  const recompose = 1.6;
  const interval = hold + separate + recompose;
  let wasPaused = false;

  $effect(() => {
    if (wasPaused && !paused) elapsed = Math.round(elapsed / interval) * interval;
    wasPaused = paused;
  });

  useTask((delta) => {
    if (!material) return;
    if (!paused) elapsed += Math.min(delta, .05);
    let shape = 0;
    let morph = 0;
    let separation = 0;
    if (scrubPhase !== null) {
      const phase = Math.max(0, Math.min(2.999, scrubPhase));
      shape = Math.floor(phase);
      morph = phase - shape;
      separation = Math.sin(morph * Math.PI) * .45;
    } else {
      const cycleIndex = Math.floor(elapsed / interval);
      const local = elapsed % interval;
      shape = cycleIndex % 3;
      if (local >= hold && local < hold + separate) separation = (local - hold) / separate;
      if (local >= hold + separate) {
        morph = (local - hold - separate) / recompose;
        separation = 1 - morph;
      }
    }
    material.uniforms.uShape.value = shape;
    material.uniforms.uMorph.value = morph;
    material.uniforms.uSeparate.value = separation;
    material.uniforms.uTime.value = elapsed;
    if (points && scrubPhase === null && !paused) points.rotation.y += delta * .035;
  }, { running: () => running });

  onMount(() => {
    const update = () => running = !document.hidden && document.documentElement.dataset.motion === "full";
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

<T.Group rotation={[pitch, yaw - .35, .08]} position={[0, offsetY, 0]} {scale}>
  <T.Points bind:ref={points} {geometry}>
    <T.ShaderMaterial bind:ref={material} uniforms={{ uShape: { value: 0 }, uMorph: { value: 0 }, uSeparate: { value: 0 }, uTime: { value: 0 }, uColor: { value: new Color(palette.primary) }, uSignal: { value: new Color(palette.accent) } }} {vertexShader} {fragmentShader} transparent depthWrite={false} blending={AdditiveBlending} />
  </T.Points>
</T.Group>
