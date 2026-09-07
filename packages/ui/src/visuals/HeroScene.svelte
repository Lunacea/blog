<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Group,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderer,
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
    palette: {
      foreground: string;
      primary: string;
      accent: string;
    };
    yaw?: number;
    pitch?: number;
    pointerX?: number;
    pointerY?: number;
    pointerAspect?: number;
    pointerActive?: number;
  } = $props();

  let host: HTMLDivElement;
  let renderer: WebGLRenderer | undefined;
  let camera: PerspectiveCamera | undefined;
  let pointGroup: Group | undefined;
  let pointMaterial: ShaderMaterial | undefined;
  let animationFrame = 0;
  let lastFrame = 0;
  let elapsed = 0;

  const count = untrack(() => quality === "high" ? 3200 : 1400);
  const positions = createHeroShapePositions(count);
  const pointGeometry = new BufferGeometry();
  pointGeometry.setAttribute("position", new Float32BufferAttribute(positions.mobius, 3));
  pointGeometry.setAttribute("aSphere", new Float32BufferAttribute(positions.sphere, 3));
  pointGeometry.setAttribute(
    "aOctahedron",
    new Float32BufferAttribute(positions.octahedron, 3),
  );
  pointGeometry.setAttribute("aSeed", new Float32BufferAttribute(positions.seeds, 1));
  const pointUniforms = {
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
  const pointVertexShader = `
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
      float pointerInfluence = (1.0 - smoothstep(.0175, .17, pointerDistance)) * uPointerActive;
      vec2 pointerDirection = normalize(pointerDelta + vec2(.0001));
      pointerDirection.x /= max(.25, uPointerAspect);
      view.xy += pointerDirection * pointerInfluence * (.22 + aSeed * .12);
      gl_Position = projectionMatrix * view;
      gl_PointSize = (3.6 + aSeed * 2.0) * (6.2 / max(2.0, -view.z));
      vSeed = aSeed;
      vDepth = 1.0 - smoothstep(4.2, 7.2, -view.z);
    }
  `;
  const pointFragmentShader = `
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
  function resize() {
    if (!renderer || !camera || !host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    if (renderer && camera) renderer.render(rendererScene, camera);
  }

  const rendererScene = new Scene();

  function frame(now: number) {
    if (!renderer || !pointMaterial || !pointGroup) return;
    const delta = Math.min(lastFrame ? (now - lastFrame) / 1000 : 0, .05);
    lastFrame = now;
    elapsed += delta;

    const hold = 3.2;
    const separate = .6;
    const recompose = 1.6;
    const interval = hold + separate + recompose;
    const cycleIndex = Math.floor(elapsed / interval);
    const local = elapsed % interval;
    const morph = local >= hold + separate ? (local - hold - separate) / recompose : 0;
    const separation = local < hold ? 0 : local < hold + separate
      ? (local - hold) / separate
      : 1 - morph;
    pointUniforms.uShape.value = cycleIndex % 3;
    pointUniforms.uMorph.value = morph;
    pointUniforms.uSeparate.value = separation;
    pointUniforms.uTime.value = elapsed;
    pointUniforms.uPointer.value.x +=
      (pointerX - pointUniforms.uPointer.value.x) * Math.min(1, delta * 12);
    pointUniforms.uPointer.value.y +=
      (pointerY - pointUniforms.uPointer.value.y) * Math.min(1, delta * 12);
    pointUniforms.uPointerAspect.value +=
      (pointerAspect - pointUniforms.uPointerAspect.value) * Math.min(1, delta * 12);
    pointUniforms.uPointerActive.value +=
      (pointerActive - pointUniforms.uPointerActive.value) * Math.min(1, delta * 9);
    pointGroup.rotation.y += delta * .04;


    render();
    animationFrame = requestAnimationFrame(frame);
  }

  function updateAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    if (!document.hidden && document.documentElement.dataset.motion === "full") {
      animationFrame = requestAnimationFrame(frame);
    } else {
      render();
    }
  }

  $effect(() => {
    pointUniforms.uColor.value.set(palette.primary);
    pointUniforms.uSignal.value.set(palette.accent);
    render();
  });

  $effect(() => {
    if (pointGroup) pointGroup.rotation.set(pitch, yaw - .35, .08);
    render();
  });

  onMount(() => {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "high" ? 1.5 : 1.2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(renderer.domElement);

    camera = new PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(0, 0, 5.8);

    pointMaterial = new ShaderMaterial({
      uniforms: pointUniforms,
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const pointCloud = new Points(pointGeometry, pointMaterial);
    pointCloud.frustumCulled = false;
    pointGroup = new Group();
    pointGroup.rotation.set(pitch, yaw - .35, .08);
    pointGroup.add(pointCloud);
    rendererScene.add(pointGroup);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    document.addEventListener("visibilitychange", updateAnimation);
    addEventListener("lunacea:motion", updateAnimation);
    resize();
    updateAnimation();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", updateAnimation);
      removeEventListener("lunacea:motion", updateAnimation);
      pointGeometry.dispose();
      pointMaterial?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      rendererScene.clear();
    };
  });
</script>

<div class="size-full [&_canvas]:block [&_canvas]:size-full" bind:this={host}></div>
