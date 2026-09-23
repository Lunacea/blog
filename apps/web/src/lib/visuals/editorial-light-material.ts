import { ShaderMaterial, Vector2, Vector3 } from "three";
import type { WeatherVisualCondition, WeatherVisualIntensity } from "./weather-visual.ts";

type Sky = {
  cloud: number;
  lift: number;
  shaft: number;
  streak: number;
  sparkle: number;
  sun: number;
  ripple: number;
  frost: number;
};
const skies: Record<WeatherVisualCondition, Sky> = {
  /* 快晴：木漏れ日の硬い斑と、カーソル位置の暖かい光だまり。 */
  clear: { cloud: 0.02, lift: 0.07, shaft: 1, streak: 0, sparkle: 0, sun: 1, ripple: 0, frost: 0 },
  neutral: {
    cloud: 0.45,
    lift: 0,
    shaft: 0.5,
    streak: 0,
    sparkle: 0,
    sun: 0.22,
    ripple: 0,
    frost: 0,
  },
  /* 曇天：光条が閉じ、画面全体が一段暗くなる。 */
  cloudy: {
    cloud: 0.8,
    lift: -0.07,
    shaft: 0.12,
    streak: 0,
    sparkle: 0,
    sun: 0,
    ripple: 0,
    frost: 0,
  },
  /* 雨：水面のコースティクスによる深い陰。降る水は描かない。 */
  rain: {
    cloud: 0.9,
    lift: -0.12,
    shaft: 0.06,
    streak: 0.35,
    sparkle: 0,
    sun: 0,
    ripple: 1,
    frost: 0,
  },
  /* 雪：低コントラストの雪原に細かい輝き。明るい地では陰として描く。 */
  snow: {
    cloud: 0.68,
    lift: 0.16,
    shaft: 0.2,
    streak: 0,
    sparkle: 1,
    sun: 0.1,
    ripple: 0,
    frost: 1,
  },
};

/** 天候色はテーマトークンなので、ここに書かず文書から読む。 */
const tokens = {
  warm: "--color-weather-light",
  cool: "--color-weather-water-shadow",
  pale: "--color-weather-snow",
} as const;

function readToken(style: CSSStyleDeclaration, token: string, target: Vector3) {
  const hex = /^#([0-9a-f]{6})$/i.exec(style.getPropertyValue(token).trim());
  if (!hex) return;
  const packed = Number.parseInt(hex[1], 16);
  target.set(((packed >> 16) & 255) / 255, ((packed >> 8) & 255) / 255, (packed & 255) / 255);
}

/** マテリアルと天候パレットはレンダラの遅延読み込み境界の内側に置く。 */
export function createEditorialLightMaterial(coarse: boolean) {
  const uniforms = {
    light: { value: new Vector2(0.32, 0.72) },
    aspect: { value: new Vector2(1, 1) },
    time: { value: 0 },
    dark: { value: 0 },
    cloud: { value: 0.45 },
    /* 符号付き露出。曇と雨は基準より下、雪は上。 */
    lift: { value: 0 },
    /* 光が一様な膜ではなく指向性の光条として届く割合。 */
    shaft: { value: 0.5 },
    /* ノイズの縦伸ばし。降らせずに濡れた天候を表す。 */
    streak: { value: 0 },
    /* 高周波の微細な持ち上げ。雪の平坦な輝き。 */
    sparkle: { value: 0 },
    /* 直射光。暖色と、カーソル位置の光だまり。 */
    sun: { value: 0.22 },
    /* 静かな水面。交差する波列とそれが落とすコースティクス。 */
    ripple: { value: 0 },
    /* 雪原の被覆量。淡い青白さとその面積。 */
    frost: { value: 0 },
    /* 待機中にだけ起こる一時的な効果。bloom は光だまりが一瞬開く量、veil は横切る雲影。 */
    bloom: { value: 0 },
    veil: { value: new Vector2(-1, -1) },
    veilStrength: { value: 0 },
    warm: { value: new Vector3(0.93, 0.86, 0.69) },
    cool: { value: new Vector3(0.08, 0.17, 0.23) },
    pale: { value: new Vector3(0.96, 0.97, 0.97) },
  };

  const material = new ShaderMaterial({
    transparent: true,
    defines: { NOISE_OCTAVES: coarse ? 3 : 5 },
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
      uniform vec2 light, aspect, veil;
      uniform vec3 warm, cool, pale;
      uniform float time, dark, cloud, lift, shaft, streak, sparkle, sun, ripple, frost;
      uniform float bloom, veilStrength;

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

      /* オクターブごとに回転させ、値ノイズの格子が縞として見えないようにする。 */
      float fbm(vec2 p){
        float sum = 0.0;
        float weight = 0.5;
        mat2 spin = turn(0.73);
        for (int i = 0; i < NOISE_OCTAVES; i++) {
          sum += weight * valueNoise(p);
          p = spin * p * 2.07 + 13.1;
          weight *= 0.5;
        }
        return sum;
      }

      void main(){
        /*
         * 光源方向は上方向の固定バイアスをカーソルが傾けるだけにする。カーソル自身のオフセットを
         * 正規化すると、中心を跨いだ瞬間に場が半回転する。
         */
        vec2 tilt = light - vec2(0.5, 0.5);
        vec2 toward = normalize(vec2(tilt.x * 1.2, 0.7 + tilt.y * 0.5));
        vec2 across = vec2(-toward.y, toward.x);
        /*
         * 明暗のランプは画面中央基準で測る。カーソル基準にすると端に寄せたとき全画素が同じ階調になる。
         */
        vec2 fromCentre = uvCoord - vec2(0.5, 0.5);
        float span = dot(fromCentre, toward);
        float lateral = dot(fromCentre, across);
        float gradient = smoothstep(-0.72, 0.62, span);

        /* カーソルは座標も時間も動かさない。天候が最も強く出る位置を示すだけ。 */
        vec2 frame = uvCoord * aspect;
        float reach = length((uvCoord - light) * aspect);
        float pool = 1.0 - smoothstep(0.0, 0.82 + bloom * 0.22, reach);
        float near = pool * pool;
        /* 加算ではなく倍率。加算は露出を片側に寄せ、明暗どちらかのテーマでしか効かなくなる。 */
        float focus = 1.0 + near * (0.78 + sun * 0.85) * (1.0 + bloom * 0.7);

        vec2 stretch = vec2(1.0, mix(1.0, 0.28, streak));

        float shafts = fbm(vec2(lateral * 7.8, span * 1.4 + time * 0.02));

        float canopy = fbm(frame * vec2(4.4, 3.7) * stretch + vec2(time * 0.014, -time * 0.009));
        float gaps = smoothstep(0.34, 0.78, canopy);

        float overcast = fbm(frame * vec2(1.8, 1.3) * stretch + vec2(time * 0.008, time * 0.004));
        float billow = smoothstep(mix(0.3, 0.4, near), mix(0.74, 0.6, near), overcast);
        float occlusion = mix(1.0, 0.24 + 0.76 * billow, cloud);

        float dapple = mix(1.0, mix(0.22, 1.0, gaps) * mix(0.5, 1.0, shafts), shaft);
        float glare = sparkle * fbm(frame * 14.0 + vec2(time * 0.02, 0.0)) * 0.34;
        float ambient = fbm(frame * vec2(1.0, 0.75) - vec2(time * 0.005, time * 0.003));

        /* 雨は落下ではなく水面。交差する二つの波列とそのコースティクスで描く。 */
        vec2 swell = frame * vec2(5.2, 3.4) - vec2(time * 0.03, time * 0.018);
        vec2 warped = swell + vec2(fbm(swell * 0.5), fbm(swell * 0.5 + 4.7)) * 1.8;
        float crossA = 1.0 - abs(sin(warped.x * 1.9 + warped.y * 0.6 + time * 0.24));
        float crossB = 1.0 - abs(sin(warped.y * 2.4 - warped.x * 0.45 - time * 0.19));
        float caustic = pow(max(crossA, crossB), 4.2);
        vec2 fine = warped * 2.3 + vec2(time * 0.09, -time * 0.05);
        float crossC = 1.0 - abs(sin(fine.x * 1.7 - fine.y * 0.8 + time * 0.31));
        float crossD = 1.0 - abs(sin(fine.y * 2.1 + fine.x * 0.4 - time * 0.27));
        caustic = caustic * 0.78 + pow(max(crossC, crossD), 5.0) * 0.34;
        float surface = 0.5 + 0.5 * sin(span * 5.4 - time * 0.5 + fbm(swell * 0.4) * 3.2);
        /* 暗いテーマでは網目が黒地の光になり突出するため、半分以下に落とす。 */
        float water = ripple * (caustic * 0.72 + surface * surface * 0.12) * mix(1.0, 0.3, dark);

        /*
         * 各テーマは基準線の片側しか描けない（明るい地に白、暗い地に影は見えない）。
         * 露出は常に見える側へ振り替える。
         */
        float exposure = lift - max(lift, 0.0) * 2.4 * (1.0 - dark) - min(lift, 0.0) * 2.4 * dark;

        /* 雲影は円ではなく雲の濃淡で縁を崩し、形のある物体に見せない。 */
        float veilReach = 1.0 - smoothstep(0.0, 0.66, length((uvCoord - veil) * aspect));
        float passing = veilStrength * veilReach * veilReach * mix(0.45, 1.0, overcast);

        float signal = (gradient * dapple * occlusion * 1.45 + ambient * 0.2 + glare
          + water * 0.9 - 0.42 + exposure - passing * 0.36) * focus;

        /* 境界の両側で連続させ、階調の縁が出ないようにする。 */
        float glow = smoothstep(0.0, 0.6, signal);
        float shade = smoothstep(0.0, 0.42, -signal);
        vec3 lit = mix(mix(vec3(1.0), warm, sun * 0.78), pale, frost * 0.5);
        vec3 dim = mix(vec3(0.0), cool, clamp(ripple + frost * 0.35, 0.0, 1.0));
        /* 日向の影は無彩色にならない。透過した光の色を帯びることが日向らしさの大半を作る。 */
        dim = mix(dim, warm * 0.48, sun * 0.62);
        vec3 tone = mix(dim, lit, step(0.0, signal));
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.045;
        /* 明暗で描く側が逆になるため、この2つの重みを近づけて両テーマの強度を揃える。 */
        float alpha = glow * mix(0.26, 0.3, dark) + shade * mix(0.3, 0.26, dark) + grain * glow;
        /* 陰として描く雪原は、明るい地では少し強めないと見えない。 */
        alpha += shade * frost * (1.0 - dark) * 0.05;
        alpha += glow * water * mix(0.26, 0.09, dark);
        gl_FragColor = vec4(tone, clamp(alpha, 0.0, 1.0));
      }`,
  });

  return {
    material,
    uniforms,
    setCondition(
      condition: WeatherVisualCondition,
      intensity: WeatherVisualIntensity = "steady",
    ) {
      const sky = skies[condition] ?? skies.neutral;
      const passing = intensity === "passing";
      /*
       * 通り雨は範囲ではなく密度が薄い。cloud・shaft・lift（構図と露出）を下げると弱い天候ではなく
       * 重い天候に見えるため触らず、天候そのものを表す4項に一律の係数をかける。
       * 一部だけ落とすと雪の通り雨が曇天と区別できなくなる。
       */
      const weather = passing ? .55 : 1;
      uniforms.cloud.value = sky.cloud;
      uniforms.shaft.value = sky.shaft;
      uniforms.sun.value = sky.sun;
      uniforms.streak.value = sky.streak * weather;
      uniforms.sparkle.value = sky.sparkle * weather;
      uniforms.ripple.value = sky.ripple * weather;
      uniforms.frost.value = sky.frost * weather;
      uniforms.lift.value = sky.lift;
    },
    setTheme(dark: boolean) {
      uniforms.dark.value = dark ? 1 : 0;
      const style = getComputedStyle(document.documentElement);
      readToken(style, tokens.warm, uniforms.warm.value);
      readToken(style, tokens.cool, uniforms.cool.value);
      readToken(style, tokens.pale, uniforms.pale.value);
    },
  };
}
