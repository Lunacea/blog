import { ShaderMaterial, Vector2, Vector3 } from "three";
import type { WeatherVisualCondition } from "./weather-visual.ts";

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
  /* Open sun: hard dappled shafts through the canopy, and a warm pool under the cursor. */
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
  /* A flat veil: the shafts close up and the whole frame steps down. */
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
  /* Deep shade under a caustic net: the still surface of a lake, never falling water. */
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
  /* A low-contrast snowfield with fine glare over it, drawn in shadow on pale paper. */
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

/** Weather colour is a theme token, so it is read from the document rather than written here. */
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

/** Material and weather palette stay behind the renderer's lazy import boundary. */
export function createEditorialLightMaterial(coarse: boolean) {
  const uniforms = {
    light: { value: new Vector2(0.32, 0.72) },
    aspect: { value: new Vector2(1, 1) },
    time: { value: 0 },
    dark: { value: 0 },
    cloud: { value: 0.45 },
    /* Signed exposure: overcast and rain sit below the resting level, snow above it. */
    lift: { value: 0 },
    /* How much of the light arrives as directional shafts rather than flat veil. */
    shaft: { value: 0.5 },
    /* Vertical stretch of the noise: wet weather smears without anything falling. */
    streak: { value: 0 },
    /* Fine high-frequency lift: the flat glare of snow. */
    sparkle: { value: 0 },
    /* Direct sunlight: warmth, and one pool of light where the cursor rests. */
    sun: { value: 0.22 },
    /* The still surface of water: crossing wave trains and the caustic net they cast. */
    ripple: { value: 0 },
    /* Snowfield cover: the pale blue-white it is drawn in, and how much of it there is. */
    frost: { value: 0 },
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
      uniform vec2 light, aspect;
      uniform vec3 warm, cool, pale;
      uniform float time, dark, cloud, lift, shaft, streak, sparkle, sun, ripple, frost;

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

      /* Each octave is rotated, so the value-noise grid never lines up into visible tiers. */
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
         * The cursor is the light itself, and everything is measured out from it. The direction
         * light falls from is a fixed overhead bias that the cursor only tilts, and the bias is
         * always longer than the tilt can reach: normalising the cursor's own offset from the
         * middle of the frame used to swing the whole field through half a turn the instant the
         * cursor crossed the centre. Moving the cursor now slides the light rather than pivoting
         * it, and a radial term is still never the wash — that is what drew concentric rings.
         */
        vec2 tilt = light - vec2(0.5, 0.5);
        vec2 toward = normalize(vec2(tilt.x * 1.2, 0.7 + tilt.y * 0.5));
        vec2 across = vec2(-toward.y, toward.x);
        /*
         * The wash is measured across the middle of the frame rather than out from the cursor, so
         * it always has a lit side and a shaded side on screen. Anchoring the ramp to the cursor
         * instead pushed the whole range off the frame as the cursor reached an edge — carry it to
         * the bottom of the window and every pixel came out the same tone, which on pale paper is
         * no picture at all. The cursor keeps the direction, and the pool below keeps its place.
         */
        vec2 fromCentre = uvCoord - vec2(0.5, 0.5);
        float span = dot(fromCentre, toward);
        float lateral = dot(fromCentre, across);
        float gradient = smoothstep(-0.72, 0.62, span);

        /*
         * The cursor never bends the ground and never brings anything of its own to it: it is
         * simply where the weather is at its strongest. Nothing below is sampled from a moved
         * coordinate or run at its own clock — both of those are a distortion of the ground by
         * another name, and they read as a lens laid over the page rather than as the sky
         * answering. All the pointer does is ask each sky for more of what it already is: deeper
         * light and shade, thicker cloud, more of the net on the water, more glitter on the snow.
         * One falloff, so it stays a pool and never draws a ring.
         */
        vec2 frame = uvCoord * aspect;
        float reach = length((uvCoord - light) * aspect);
        float pool = 1.0 - smoothstep(0.0, 0.82, reach);
        float near = pool * pool;
        /*
         * The pointer scales what the sky is doing rather than adding to it. Adding — another
         * helping of the caustic net, of the snow's glitter — pushes the exposure one way, which
         * is exactly the direction one theme draws in and the other cannot: the same pointer then
         * strengthens the dark page and washes out the paper. Scaling deepens both sides of the
         * crossing at once, so the light gets lighter and the shade gets deeper together, and
         * every sky answers the cursor by the same amount in either theme.
         */
        float focus = 1.0 + near * (0.78 + sun * 0.85);

        /* Wet weather stretches the noise downward; nothing is ever drawn falling. */
        vec2 stretch = vec2(1.0, mix(1.0, 0.28, streak));

        /* Long thin breaks along the light: the shafts between the branches. */
        float shafts = fbm(vec2(lateral * 7.8, span * 1.4 + time * 0.02));

        /* A canopy over them: high-contrast gaps that scatter the shafts into patches. */
        float canopy = fbm(frame * vec2(4.4, 3.7) * stretch + vec2(time * 0.014, -time * 0.009));
        float gaps = smoothstep(0.34, 0.78, canopy);

        /*
         * Cloud cover only ever closes the canopy further, and it gathers where the cursor is:
         * the same veil, read through a narrower band, so its billows stand out from each other
         * instead of the whole sheet lifting or thinning. More cloud, not different cloud.
         */
        float overcast = fbm(frame * vec2(1.8, 1.3) * stretch + vec2(time * 0.008, time * 0.004));
        float billow = smoothstep(mix(0.3, 0.4, near), mix(0.74, 0.6, near), overcast);
        float occlusion = mix(1.0, 0.24 + 0.76 * billow, cloud);

        float dapple = mix(1.0, mix(0.22, 1.0, gaps) * mix(0.5, 1.0, shafts), shaft);
        float glare = sparkle * fbm(frame * 14.0 + vec2(time * 0.02, 0.0)) * 0.34;
        float ambient = fbm(frame * vec2(1.0, 0.75) - vec2(time * 0.005, time * 0.003));

        /*
         * Rain reads as the surface of a still lake instead of falling water: two wave trains
         * cross, each warped by the slow swell beneath them, and the thin bright net where they
         * meet is the caustic light on the floor. A second, finer pass of the same figure gives
         * the net the detail a real surface has, and a wide rise and fall carries it all across
         * the frame.
         */
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
        /*
         * On paper the net only ever pales the ground, which is the whole of the picture; on a
         * dark page the same net is light on black and reads far louder than any other sky, so
         * the dark theme takes it at well under half strength.
         */
        float water = ripple * (caustic * 0.72 + surface * surface * 0.12) * mix(1.0, 0.3, dark);

        /*
         * Each theme can only draw on one side of the resting level: white on pale paper is
         * nothing, and shadow on a dark page is nothing either. So a condition's exposure is
         * always spent on the side that reads — a bright sky becomes the dapple and drifts it
         * casts on paper, a dull one becomes the light breaking through it in the dark — and a
         * condition already sitting on the readable side is left exactly as it was.
         */
        float exposure = lift - max(lift, 0.0) * 2.4 * (1.0 - dark) - min(lift, 0.0) * 2.4 * dark;

        float signal = (gradient * dapple * occlusion * 1.45 + ambient * 0.2 + glare
          + water * 0.9 - 0.42 + exposure) * focus;

        /* Continuous on both sides of the crossing, so no tier ever draws an edge. */
        float glow = smoothstep(0.0, 0.6, signal);
        float shade = smoothstep(0.0, 0.42, -signal);
        /* Weather is the only colour here: sun is warm, lake water cold, snow a pale blue-white. */
        vec3 lit = mix(mix(vec3(1.0), warm, sun * 0.78), pale, frost * 0.5);
        vec3 dim = mix(vec3(0.0), cool, clamp(ripple + frost * 0.35, 0.0, 1.0));
        /* Sunlit shadow is never neutral: it carries the colour of whatever the light came
           through, which is most of what makes a page read as being in the sun at all. */
        dim = mix(dim, warm * 0.48, sun * 0.62);
        vec3 tone = mix(dim, lit, step(0.0, signal));
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.045;
        /*
         * The two themes draw on opposite sides of the crossing — paper can only show the shade,
         * a dark page only the light — so these two weights are what decides whether the field
         * carries the same amount in both. They are held close together on purpose: the dark side
         * used to be paid half again as much, and the same weather came out a mild wash on paper
         * and a loud one in the dark.
         */
        float alpha = glow * mix(0.26, 0.3, dark) + shade * mix(0.3, 0.26, dark) + grain * glow;
        /* A snowfield drawn in shadow needs a little more of it than a lit one to register. */
        alpha += shade * frost * (1.0 - dark) * 0.05;
        /* The caustic net is the whole picture in rain, so it carries its own weight. */
        alpha += glow * water * mix(0.26, 0.09, dark);
        gl_FragColor = vec4(tone, clamp(alpha, 0.0, 1.0));
      }`,
  });

  return {
    material,
    uniforms,
    setCondition(condition: WeatherVisualCondition) {
      // Weather reads only as light: open sun, a flat veil, a lake surface, or a snowfield.
      const sky = skies[condition] ?? skies.neutral;
      uniforms.cloud.value = sky.cloud;
      uniforms.lift.value = sky.lift;
      uniforms.shaft.value = sky.shaft;
      uniforms.streak.value = sky.streak;
      uniforms.sparkle.value = sky.sparkle;
      uniforms.sun.value = sky.sun;
      uniforms.ripple.value = sky.ripple;
      uniforms.frost.value = sky.frost;
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
