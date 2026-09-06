<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { T, useTask } from "@threlte/core";
  import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    type Points,
    type ShaderMaterial,
    Vector2,
  } from "three";
  import { createHeroShapePositions } from "./hero-geometry.ts";

  let {
    quality,
    palette,
    yaw = 0,
    pitch = 0,
    pointerX = 0,
    pointerY = 0,
    pointerAspect = 1,
    pointerActive = 0,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
    yaw?: number;
    pitch?: number;
    pointerX?: number;
    pointerY?: number;
    pointerAspect?: number;
    pointerActive?: number;
  } = $props();

  const count = untrack(() => quality === "high" ? 3200 : 1400);
  const positions = createHeroShapePositions(count);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions.mobius, 3));
  geometry.setAttribute("aSphere", new Float32BufferAttribute(positions.sphere, 3));
  geometry.setAttribute("aOctahedron", new Float32BufferAttribute(positions.octahedron, 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(positions.seeds, 1));
  const uniforms = {
    uShape: { value: 0 },
    uMorph: { value: 0 },
    uSeparate: { value: 0 },
    uTime: { value: 0 },
    uColor: { value: new Color(untrack(() => palette.primary)) },
    uSignal: { value: new Color(untrack(() => palette.accent)) },
    uPointer: { value: new Vector2() },
    uPointerAspect: { value: 1 },
    uPointerActive: { value: 0 },
  };

  const vertexShader = `
    uniform float uShape;
    uniform float uMorph;
    uniform float uSeparate;
    uniform float uTime;
    uniform vec2 uPointer;
    uniform float uPointerAspect;
    uniform float uPointerActive;
    attribute vec3 aSphere;
    attribute vec3 aOctahedron;
    attribute float aSeed;
    varying float vSeed;
    varying float vDepth;
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
      vec4 projected = projectionMatrix * view;
      vec2 screenPosition = projected.xy / projected.w;
      vec2 pointerDelta = screenPosition - uPointer;
      pointerDelta.x *= uPointerAspect;
      float pointerDistance = length(pointerDelta);
      float pointerInfluence = (1.0 - smoothstep(.035, .34, pointerDistance)) * uPointerActive;
      vec2 pointerDirection = normalize(pointerDelta + vec2(.0001));
      pointerDirection.x /= max(.25, uPointerAspect);
      view.xy += pointerDirection * pointerInfluence * (.22 + aSeed * .12);
      gl_Position = projectionMatrix * view;
      gl_PointSize = (3.6 + aSeed * 2.0) * (6.2 / max(2.0, -view.z));
      vSeed = aSeed;
      vDepth = 1.0 - smoothstep(4.2, 7.2, -view.z);
    }
  `;
  const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uSignal;
    varying float vSeed;
    varying float vDepth;
    void main() {
      vec2 point = gl_PointCoord - .5;
      float diamond = abs(point.x) + abs(point.y);
      if (diamond > .44) discard;
      vec3 color = mix(uColor, uSignal, step(.82, vSeed));
      float edge = 1.0 - smoothstep(.28, .44, diamond);
      gl_FragColor = vec4(color, edge * (.58 + vSeed * .34) * (.72 + vDepth * .28));
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
  useTask((delta) => {
    if (!material) return;
    elapsed += Math.min(delta, .05);
    let shape = 0;
    let morph = 0;
    let separation = 0;
    const cycleIndex = Math.floor(elapsed / interval);
    const local = elapsed % interval;
    shape = cycleIndex % 3;
    if (local >= hold && local < hold + separate) separation = (local - hold) / separate;
    if (local >= hold + separate) {
      morph = (local - hold - separate) / recompose;
      separation = 1 - morph;
    }
    material.uniforms.uShape.value = shape;
    material.uniforms.uMorph.value = morph;
    material.uniforms.uSeparate.value = separation;
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uPointer.value.x +=
      (pointerX - material.uniforms.uPointer.value.x) * Math.min(1, delta * 12);
    material.uniforms.uPointer.value.y +=
      (pointerY - material.uniforms.uPointer.value.y) * Math.min(1, delta * 12);
    material.uniforms.uPointerAspect.value +=
      (pointerAspect - material.uniforms.uPointerAspect.value) * Math.min(1, delta * 12);
    material.uniforms.uPointerActive.value +=
      (pointerActive - material.uniforms.uPointerActive.value) * Math.min(1, delta * 9);
    if (points) points.rotation.y += delta * .04;
  }, { running: () => running });

  $effect(() => {
    uniforms.uColor.value.set(palette.primary);
    uniforms.uSignal.value.set(palette.accent);
  });

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

<T.Group rotation={[pitch, yaw - .35, .08]}>
  <T.Points bind:ref={points} {geometry}>
    <T.ShaderMaterial bind:ref={material} {uniforms} {vertexShader} {fragmentShader} transparent depthWrite={false} blending={AdditiveBlending} />
  </T.Points>
</T.Group>
