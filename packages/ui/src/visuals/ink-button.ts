import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

/*
  インクの色はテーマのトークンから取る。--color-ink は @property で色として登録された
  --color-foreground を指すので、算出値は hex ではなく rgb() 等で返ってくる。
  書式を自前で数えると取りこぼすため、1px のキャンバスに塗らせて読む。
*/
let probe: CanvasRenderingContext2D | null = null;
let cachedToken = "";
const cachedInk = new Vector3(0.09, 0.09, 0.09);

/*
  テーマの切り替えは色そのものが 420ms かけて遷移するので、切り替え通知の一度読みでは
  遷移前の色を掴む。毎フレーム読み、トークンの文字列が変わったときだけ塗り直す。
*/
function readInk(): Vector3 {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim();
  if (raw === cachedToken) return cachedInk;
  cachedToken = raw;
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe || !raw) return cachedInk;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = raw;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return cachedInk.set(r / 255, g / 255, b / 255);
}

/** 満ちきるまでの秒。--motion-duration-base に合わせる。 */
const FILL = 0.42;

/**
 * ボタンの面に張る液体インク。ホバーで左から右へ流れ込み、先端はポインタの高さで前に出る。
 * 純粋な装飾で、載らない場合は下に敷いた塗りが同じ役目を果たす。
 */
export function mountInkButton(host: HTMLElement, failure: () => void) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.className = "pointer-events-none absolute inset-0 size-full";
  host.appendChild(renderer.domElement);

  const uniforms = {
    time: { value: 0 },
    /** 0 は空、1 は満ちた状態。 */
    level: { value: 0 },
    /** ポインタの位置（0..1）。先端はこの高さで前に出る。 */
    pointer: { value: new Vector2(0.5, 0.5) },
    aspect: { value: 1 },
    ink: { value: readInk().clone() },
  };

  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec2 uvCoord;
      void main() {
        uvCoord = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: `
      precision mediump float;
      varying vec2 uvCoord;
      uniform float time, level, aspect;
      uniform vec2 pointer;
      uniform vec3 ink;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y);
      }

      void main() {
        /* 面は横長なので、x 方向の距離は aspect で割り、画素の尺度を縦横で揃える。 */
        float soft = 0.045 / aspect;
        /* 満ちるほど波を鎮める。満ちきった面が平らでないと、文字の下でちらつく。 */
        float calm = level * (1.0 - smoothstep(0.82, 1.0, level));
        /* 先端のうねり。二つの周期を重ね、割り切れない比にして拍を作らない。 */
        float swell = noise(vec2(uvCoord.y * 3.1 + time * 0.55, time * 0.31)) - 0.5;
        float ripple = sin(uvCoord.y * 6.0 - time * 2.1) * 0.5 + sin(uvCoord.y * 3.7 + time * 1.3) * 0.5;
        /* ポインタの高さで先端が前に出る。指が液を引いているように見せる。 */
        float near = exp(-pow((uvCoord.y - pointer.y) * 2.2, 2.0));
        float wave = (swell * 0.30 + ripple * 0.09 + near * 0.45) / aspect;
        float front = level * (1.0 + soft * 3.0) - soft * 1.5 + wave * calm;
        /* 縁は一画素で切らずに滲ませる。紙に落ちたインクの縁になる。 */
        float body = smoothstep(front + soft, front - soft, uvCoord.x);
        /* 先端の直後だけ少し濃くして、溜まりの厚みを出す。 */
        float meniscus = smoothstep(front + soft * 0.4, front - soft * 1.3, uvCoord.x)
          - smoothstep(front - soft * 1.3, front - soft * 3.5, uvCoord.x);
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.04;
        float alpha = clamp(body + meniscus * 0.22 + grain * body, 0.0, 1.0);
        gl_FragColor = vec4(ink, alpha);
      }`,
  });

  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let destroyed = false;
  let frame = 0;
  let last = 0;
  let target = 0;
  /* 素の進み。level はこれを署名イージングに通した値。 */
  let phase = 0;
  let width = 0;
  let height = 0;

  const resize = () => {
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    uniforms.aspect.value = width / height;
  };

  const draw = (now: number) => {
    if (destroyed) return;
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    uniforms.time.value += delta;
    uniforms.ink.value.copy(readInk());
    phase = Math.min(1, Math.max(0, phase + (target ? delta : -delta) / FILL));
    /* 両端をゆっくりにする。サイト共通の署名イージングと同じ立ち上がり方をさせる。 */
    uniforms.level.value = phase * phase * phase * (phase * (phase * 6 - 15) + 10);
    resize();
    renderer.render(scene, camera);
    /* 空に戻り切ったら描くものが無い。次のホバーで起こす。 */
    if (target === 0 && phase === 0) {
      frame = 0;
      last = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
  };

  const wake = () => {
    if (destroyed || frame) return;
    last = 0;
    frame = requestAnimationFrame(draw);
  };

  const lost = (event: Event) => {
    event.preventDefault();
    failure();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);

  resize();
  renderer.render(scene, camera);

  return {
    setHover(next: boolean) {
      target = next ? 1 : 0;
      wake();
    },
    setPointer(x: number, y: number) {
      uniforms.pointer.value.set(x, y);
      wake();
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.remove();
      material.dispose();
      renderer.dispose();
    },
  };
}
