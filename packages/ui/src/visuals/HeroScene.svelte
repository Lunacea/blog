<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Group,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector4,
    WebGLRenderer,
  } from "three";
  import { createHeroShapePositions } from "./hero-geometry.ts";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let {
    quality,
    palette,
    yaw = 0,
    pitch = 0,
    pointerX = 0,
    pointerY = 0,
    pointerAspect = 1,
    pointerActive = 0,
    weather,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
    yaw?: number;
    pitch?: number;
    pointerX?: number;
    pointerY?: number;
    pointerAspect?: number;
    pointerActive?: number;
    weather: WeatherVisualCondition;
  } = $props();

  let host: HTMLDivElement;
  let renderer: WebGLRenderer | undefined;
  let camera: PerspectiveCamera | undefined;
  let pointGroup: Group | undefined;
  let pointMaterial: ShaderMaterial | undefined;
  let weatherMaterial: ShaderMaterial | undefined;
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
  const weatherGeometry = new PlaneGeometry(2, 2);
  const weatherWeights = new Vector4();

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
  const weatherUniforms = {
    uTime: { value: 0 },
    uDensity: { value: untrack(() => quality === "high" ? 1 : .72) },
    uWeather: { value: weatherWeights },
    uForeground: { value: new Color(untrack(() => palette.foreground)) },
    uPrimary: { value: new Color(untrack(() => palette.primary)) },
    uAccent: { value: new Color(untrack(() => palette.accent)) },
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
  const weatherVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const weatherFragmentShader = `
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

  function weatherTarget(value: WeatherVisualCondition): [number, number, number, number] {
    if (value === "clear") return [1, 0, 0, 0];
    if (value === "cloudy") return [0, 1, 0, 0];
    if (value === "rain") return [0, 0, 1, 0];
    if (value === "snow") return [0, 0, 0, 1];
    return [0, 0, 0, 0];
  }

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
    if (!renderer || !pointMaterial || !weatherMaterial || !pointGroup) return;
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

    const nextWeather = weatherTarget(weather);
    const blend = 1 - Math.exp(-delta * 2.4);
    weatherWeights.x += (nextWeather[0] - weatherWeights.x) * blend;
    weatherWeights.y += (nextWeather[1] - weatherWeights.y) * blend;
    weatherWeights.z += (nextWeather[2] - weatherWeights.z) * blend;
    weatherWeights.w += (nextWeather[3] - weatherWeights.w) * blend;
    weatherUniforms.uTime.value = (elapsed % 32) / 32;

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
    weatherUniforms.uForeground.value.set(palette.foreground);
    weatherUniforms.uPrimary.value.set(palette.primary);
    weatherUniforms.uAccent.value.set(palette.accent);
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

    weatherMaterial = new ShaderMaterial({
      uniforms: weatherUniforms,
      vertexShader: weatherVertexShader,
      fragmentShader: weatherFragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const weatherPlane = new Mesh(weatherGeometry, weatherMaterial);
    weatherPlane.position.set(0, 0, -2.4);
    weatherPlane.scale.set(5.2, 3.4, 1);
    rendererScene.add(weatherPlane);

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
      weatherGeometry.dispose();
      pointMaterial?.dispose();
      weatherMaterial?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      rendererScene.clear();
    };
  });
</script>

<div class="scene" bind:this={host}></div>

<style>
  .scene {
    width: 100%;
    height: 100%;
  }

  .scene :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
