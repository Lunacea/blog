import { ShaderMaterial, Vector2, Vector3 } from "three";
import type { PulseFrame } from "./ambient-pulses.ts";
import type { Sunlight } from "./sunlight.ts";
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
    cloud: 0.7,
    lift: -0.05,
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
  amber: "--color-weather-dusk",
  moon: "--color-weather-moon",
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
    /*
     * 待機中にだけ起こる一時的な効果。bloom は光だまりが一瞬開く量、veil は横切る雲影
     * （veilSize はその大きさ）、clearing は雲間の xy と強さ、gust は雪煙の xy と強さ。
     */
    bloom: { value: 0 },
    veil: { value: new Vector2(-1, -1) },
    veilStrength: { value: 0 },
    veilSize: { value: 0.66 },
    clearing: { value: new Vector3(-1, -1, 0) },
    /* 雨の波紋。xy は中心、z は広がった半径。 */
    ring: { value: new Vector3(-1, -1, 0) },
    ringStrength: { value: 0 },
    gust: { value: new Vector3(-1, -1, 0) },
    /* 地点の時刻。朝夕の低い光、夜の深さ、光の来る側（-1 東、1 西）、光の低さ。 */
    dusk: { value: 0 },
    night: { value: 0 },
    sunSide: { value: 0 },
    sunLow: { value: 0 },
    warm: { value: new Vector3(0.93, 0.86, 0.69) },
    cool: { value: new Vector3(0.08, 0.17, 0.23) },
    pale: { value: new Vector3(0.96, 0.97, 0.97) },
    amber: { value: new Vector3(0.91, 0.65, 0.43) },
    moon: { value: new Vector3(0.66, 0.74, 0.81) },
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
      uniform vec3 warm, cool, pale, amber, moon, ring, clearing, gust;
      uniform float time, dark, cloud, lift, shaft, streak, sparkle, sun, ripple, frost;
      uniform float bloom, veilStrength, veilSize, ringStrength, dusk, night, sunSide, sunLow;

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
        /* 朝夕は光が横から低く入る。夜は向きを持たない。 */
        vec2 toward = normalize(vec2(
          tilt.x * 1.2 + sunSide * sunLow * 0.9,
          0.7 * (1.0 - sunLow * 0.6) + tilt.y * 0.5
        ));
        /* 雲は低い太陽を最初に遮る。曇りや雨の夕方は色づきをほとんど残さない。 */
        float duskLit = dusk * mix(1.0, 0.2, cloud);
        /*
         * 夜も晴れは晴れらしく、木漏れ日の構造は残して月明かりの色と明るさだけを落とす。
         * 構造まで消すと晴れの夜が曇りと見分けられなくなる。朝夕は低い光がかえって強く色づく。
         */
        float daySun = sun * (1.0 - night * 0.3) + duskLit * 0.4;
        float dayShaft = shaft * (1.0 - night * 0.15);
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
        float focus = 1.0 + near * (0.78 + daySun * 0.85) * (1.0 + bloom * 0.7);

        vec2 stretch = vec2(1.0, mix(1.0, 0.28, streak));

        float shafts = fbm(vec2(lateral * 7.8, span * 1.4 + time * 0.02));

        float canopy = fbm(frame * vec2(4.4, 3.7) * stretch + vec2(time * 0.014, -time * 0.009));
        float gaps = smoothstep(0.34, 0.78, canopy);

        /*
         * 雲は高さの違う2層を別の向きと速さで流す。1層だと全体が一枚で滑るだけに見える。
         * 下層は平均せずに上層の濃淡へ細部として足す。平均すると濃淡の幅が縮み、空が一様な灰色の
         * 塊になる。
         */
        float upper = fbm(frame * vec2(1.8, 1.3) * stretch + vec2(time * 0.008, time * 0.004));
        float lower = fbm(frame * vec2(2.6, 1.9) * stretch + vec2(-time * 0.019, time * 0.007) + 5.3);
        float overcast = upper + (lower - 0.5) * (0.22 + cloud * 0.18);
        /* 境界を狭めて、雲の塊と切れ間をはっきり分ける。広いと空全体が中間の灰色に均される。 */
        float billow = smoothstep(mix(0.36, 0.44, near), mix(0.62, 0.56, near), overcast);
        /* 雲間：雲が局所的に薄れ、そこだけ光条と斑が戻る。 */
        float clearingReach = 1.0 - smoothstep(0.0, 0.5, length((uvCoord - clearing.xy) * aspect));
        float opening = clearing.z * clearingReach * clearingReach;
        float occlusion = mix(1.0, 0.24 + 0.76 * billow, cloud * (1.0 - opening * 0.8));

        float dapple = mix(1.0, mix(0.22, 1.0, gaps) * mix(0.5, 1.0, shafts),
          clamp(dayShaft + opening * 0.7, 0.0, 1.0));
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
        /* 網目は地の色によって強く出すぎる。明るい地では 4 割、暗い地では黒地の光になるので 3 割。 */
        float water = ripple * (caustic * 0.72 + surface * surface * 0.12) * mix(0.4, 0.3, dark);

        /*
         * 各テーマは基準線の片側しか描けない（明るい地に白、暗い地に影は見えない）。
         * 露出は常に見える側へ振り替える。
         */
        float exposure = lift - max(lift, 0.0) * 2.4 * (1.0 - dark) - min(lift, 0.0) * 2.4 * dark;

        /* 雲影は円ではなく雲の濃淡で縁を崩し、形のある物体に見せない。 */
        float veilReach = 1.0 - smoothstep(0.0, veilSize, length((uvCoord - veil) * aspect));
        float passing = veilStrength * veilReach * veilReach * mix(0.45, 1.0, overcast);

        /* 波紋は明るい峰と暗い谷の対にする。どちらのテーマでも片側が見える。 */
        float ringReach = length((uvCoord - ring.xy) * aspect);
        float crest = exp(-pow((ringReach - ring.z) / 0.05, 2.0));
        float trough = exp(-pow((ringReach - ring.z + 0.09) / 0.06, 2.0));
        float ripplePulse = ringStrength * (crest - trough * 0.75)
          * (1.0 - smoothstep(0.55, 1.05, ring.z));

        /*
         * 雪煙：風に巻き上げられた細かな雪が淡い明るみの帯として渡る。点ではなく、流れる
         * ノイズの濃淡で描く。明るい地では陰が持ち上がり、暗い地では明るみとして見える。
         */
        vec2 gustOffset = (uvCoord - gust.xy) * aspect;
        float gustReach = 1.0 - smoothstep(0.0, 0.62, length(gustOffset * vec2(0.7, 1.3)));
        float powder = fbm(frame * vec2(6.5, 9.0) + vec2(-time * 0.34, time * 0.12));
        float drifting = gust.z * gustReach * gustReach * smoothstep(0.35, 0.8, powder);

        float signal = (gradient * dapple * occlusion * 1.45 + ambient * 0.2 + glare
          + water * 0.9 - 0.42 + exposure - passing * mix(0.52, 0.36, dark) + ripplePulse * 0.42
          + drifting * 0.5) * focus;

        /* 境界の両側で連続させ、階調の縁が出ないようにする。 */
        float glow = smoothstep(0.0, 0.6, signal);
        float shade = smoothstep(0.0, 0.42, -signal);
        vec3 lit = mix(mix(vec3(1.0), warm, daySun * 0.78), pale, clamp(frost * 0.5 + drifting, 0.0, 1.0));
        /*
         * 明るい地では白い光は地に溶けて見えない。光を色として描き、日差しは暖色、雲の下は
         * 地より僅かに明るい白、雪と水面は冷たい色にする。暗い地では従来どおり明るさで描く。
         */
        vec3 paperLit = mix(pale * 0.97, mix(warm * 0.93, amber, 0.18), clamp(daySun * 1.4, 0.0, 1.0));
        paperLit = mix(paperLit, mix(pale, cool, 0.4), clamp(frost + ripple * 0.5, 0.0, 1.0));
        lit = mix(paperLit, lit, dark);
        lit = mix(lit, amber, duskLit * 0.6);
        lit = mix(lit, moon, night * 0.55);
        vec3 dim = mix(vec3(0.0), cool, clamp(ripple + frost * 0.35, 0.0, 1.0));
        /* 日向の影は無彩色にならない。透過した光の色を帯びることが日向らしさの大半を作る。 */
        dim = mix(dim, warm * 0.48, daySun * 0.62);
        dim = mix(dim, amber * 0.42, duskLit * 0.45);
        dim = mix(dim, moon * 0.3, night * 0.4);
        vec3 tone = mix(dim, lit, step(0.0, signal));
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.045;
        /* 明暗で描く側が逆になるため、この2つの重みを近づけて両テーマの強度を揃える。 */
        float alpha = glow * mix(0.36, 0.3, dark) + shade * mix(0.3, 0.26, dark) + grain * glow;
        /* 陰として描く雪原は、明るい地では少し強めないと見えない。 */
        alpha += shade * frost * (1.0 - dark) * 0.05;
        alpha += glow * water * mix(0.16, 0.09, dark);
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
    /** 待機中の出来事を渡す。 */
    setPulses(frame: PulseFrame) {
      uniforms.bloom.value = frame.bloom;
      uniforms.veil.value.set(frame.veil.x, frame.veil.y);
      uniforms.veilStrength.value = frame.veil.strength;
      uniforms.veilSize.value = frame.veil.size;
      uniforms.ring.value.set(frame.ring.x, frame.ring.y, frame.ring.radius);
      uniforms.ringStrength.value = frame.ring.strength;
      uniforms.clearing.value.set(frame.clearing.x, frame.clearing.y, frame.clearing.strength);
      uniforms.gust.value.set(frame.gust.x, frame.gust.y, frame.gust.strength);
    },
    /** 地点の時刻による光を渡す。 */
    setDaylight(sky: Sunlight) {
      uniforms.dusk.value = sky.dusk;
      uniforms.night.value = sky.night;
      uniforms.sunSide.value = sky.side;
      uniforms.sunLow.value = sky.low;
    },
    setTheme(dark: boolean) {
      uniforms.dark.value = dark ? 1 : 0;
      const style = getComputedStyle(document.documentElement);
      readToken(style, tokens.warm, uniforms.warm.value);
      readToken(style, tokens.cool, uniforms.cool.value);
      readToken(style, tokens.pale, uniforms.pale.value);
      readToken(style, tokens.amber, uniforms.amber.value);
      readToken(style, tokens.moon, uniforms.moon.value);
    },
  };
}
