<script lang="ts">
  import { onMount } from "svelte";
  import { T, useTask } from "@threlte/core";
  import {
    AdditiveBlending,
    Color,
    DoubleSide,
    type Mesh,
    type ShaderMaterial,
    Vector2,
  } from "three";

  let {
    quality,
    palette,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
  } = $props();

  const outerProfile = [
    new Vector2(0.08, -1.72),
    new Vector2(0.58, -1.5),
    new Vector2(1.02, -0.82),
    new Vector2(0.76, -0.08),
    new Vector2(1.08, 0.68),
    new Vector2(0.62, 1.38),
    new Vector2(0.08, 1.7),
  ];
  const innerProfile = [
    new Vector2(0.06, -1.34),
    new Vector2(0.42, -1.16),
    new Vector2(0.68, -0.42),
    new Vector2(0.55, 0.3),
    new Vector2(0.7, 0.86),
    new Vector2(0.35, 1.22),
    new Vector2(0.06, 1.34),
  ];

  const vertexShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vWave;

    void main() {
      float waveA = sin(position.y * 3.7 + uTime * 0.17);
      float waveB = sin(position.y * 7.1 - uTime * 0.113 + position.x * 1.9);
      float waveC = sin(position.y * 11.3 + uTime * 0.071 + position.z * 2.3);
      float wave = (waveA * 0.5 + waveB * 0.3 + waveC * 0.2);
      vec3 transformed = position + normal * wave * 0.035;
      vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewPosition = -viewPosition.xyz;
      vWave = wave;
      gl_Position = projectionMatrix * viewPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uSignal;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vWave;

    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.4);
      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      vec3 color = mix(uColor * 0.62, uSignal, fresnel * 0.24 + max(vWave, 0.0) * 0.05);
      float alpha = 0.1 + fresnel * 0.4 + grain * 0.025;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  let outer = $state<Mesh>();
  let inner = $state<Mesh>();
  let material = $state<ShaderMaterial>();
  let running = $state(true);
  let elapsed = 0;

  useTask(
    (delta) => {
      elapsed += Math.min(delta, 0.05);
      if (material) material.uniforms.uTime.value = elapsed;
      if (outer) {
        outer.rotation.y += delta * (0.027 + Math.sin(elapsed * 0.13) * 0.004);
        outer.rotation.z = Math.sin(elapsed * 0.071) * 0.055 + Math.sin(elapsed * 0.041) * 0.02;
        const breath = 1 + Math.sin(elapsed * 0.17) * 0.012 + Math.sin(elapsed * 0.113) * 0.007;
        outer.scale.setScalar(breath);
      }
      if (inner) {
        inner.rotation.y -= delta * 0.018;
        inner.position.y = Math.sin(elapsed * 0.109) * 0.035;
      }
    },
    { running: () => running },
  );

  onMount(() => {
    const updateVisibility = () => {
      running = !document.hidden && document.documentElement.dataset.motion === "full";
    };
    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("lunacea:motion", updateVisibility);
    updateVisibility();
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("lunacea:motion", updateVisibility);
    };
  });
</script>

<T.Group rotation={[0.04, -0.38, 0.08]}>
  <T.Mesh bind:ref={inner}>
    <T.LatheGeometry args={[innerProfile, quality === "high" ? 36 : 20]} />
    <T.MeshStandardMaterial
      color={palette.primary}
      roughness={0.88}
      metalness={0.04}
      transparent
      opacity={0.52}
    />
  </T.Mesh>

  <T.Mesh bind:ref={outer}>
    <T.LatheGeometry args={[outerProfile, quality === "high" ? 64 : 28]} />
    <T.ShaderMaterial
      bind:ref={material}
      uniforms={{
        uTime: { value: 0 },
        uColor: { value: new Color(palette.primary) },
        uSignal: { value: new Color(palette.accent) },
      }}
      {vertexShader}
      {fragmentShader}
      side={DoubleSide}
      transparent
      depthWrite={false}
      blending={AdditiveBlending}
    />
  </T.Mesh>

  <T.Mesh rotation={[Math.PI / 2, 0, 0]}>
    <T.TorusGeometry args={[1.28, 0.006, 4, quality === "high" ? 96 : 48]} />
    <T.MeshBasicMaterial color={palette.foreground} transparent opacity={0.22} />
  </T.Mesh>
</T.Group>
