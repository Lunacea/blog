import { ShaderMaterial, Vector2 } from "three";
import type { WeatherVisualCondition } from "./weather-visual.ts";

type Sky = { cloud: number; lift: number; shaft: number; streak: number; sparkle: number };
const skies: Record<WeatherVisualCondition, Sky> = {
  /* Open sun: hard dappled shafts through the canopy. */
  clear: { cloud: 0.02, lift: 0.06, shaft: 1, streak: 0, sparkle: 0 },
  neutral: { cloud: 0.45, lift: 0, shaft: 0.5, streak: 0, sparkle: 0 },
  /* A flat veil: the shafts close up and the whole frame steps down. */
  cloudy: { cloud: 0.8, lift: -0.07, shaft: 0.12, streak: 0, sparkle: 0 },
  /* Deep shade, and the noise stretched downward into streaks. */
  rain: { cloud: 0.95, lift: -0.17, shaft: 0.05, streak: 1, sparkle: 0 },
  /* A bright, low-contrast whiteout with fine glare over it. */
  snow: { cloud: 0.68, lift: 0.16, shaft: 0.2, streak: 0, sparkle: 1 },
};

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
    /* Vertical stretch of the noise: rain reads as streaks without anything falling. */
    streak: { value: 0 },
    /* Fine high-frequency lift: the flat glare of snow. */
    sparkle: { value: 0 },
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
      uniform float time, dark, cloud, lift, shaft, streak, sparkle;

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
         * The pointer sets the direction light falls from, never a point: a radial term is what
         * drew concentric rings across the page. Everything else is noise.
         */
        vec2 fall = normalize(light - vec2(0.5, 0.5) + vec2(0.0001));
        vec2 across = vec2(-fall.y, fall.x);
        vec2 frame = uvCoord * aspect;
        float span = dot(uvCoord - vec2(0.5, 0.5), fall);
        float gradient = 1.0 - smoothstep(-0.58, 0.62, span);

        /* Rain stretches the noise downward; nothing is ever drawn falling. */
        vec2 stretch = vec2(1.0, mix(1.0, 0.28, streak));

        /* Long thin breaks along the light: the shafts between the branches. */
        float lateral = dot(uvCoord - vec2(0.5, 0.5), across);
        float shafts = fbm(vec2(lateral * 7.8, span * 1.4 + time * 0.02));

        /* A canopy over them: high-contrast gaps that scatter the shafts into patches. */
        float canopy = fbm(frame * vec2(4.4, 3.7) * stretch + vec2(time * 0.014, -time * 0.009));
        float gaps = smoothstep(0.34, 0.78, canopy);

        /* Cloud cover only ever closes the canopy further. */
        float overcast = fbm(frame * vec2(1.8, 1.3) * stretch + vec2(time * 0.008, time * 0.004));
        float occlusion = mix(1.0, 0.24 + 0.76 * smoothstep(0.3, 0.74, overcast), cloud);

        float dapple = mix(1.0, mix(0.22, 1.0, gaps) * mix(0.5, 1.0, shafts), shaft);
        float glare = sparkle * fbm(frame * 14.0 + vec2(time * 0.02, 0.0)) * 0.34;
        float ambient = fbm(frame * vec2(1.0, 0.75) - vec2(time * 0.005, time * 0.003));

        float signal = gradient * dapple * occlusion * 1.45 + ambient * 0.2 + glare - 0.42 + lift;

        /* Continuous on both sides of the crossing, so no tier ever draws an edge. */
        float glow = smoothstep(0.0, 0.6, signal);
        float shade = smoothstep(0.0, 0.42, -signal);
        vec3 tone = mix(vec3(0.0), vec3(1.0), step(0.0, signal));
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.045;
        float alpha = glow * mix(0.26, 0.46, dark) + shade * mix(0.3, 0.26, dark) + grain * glow;
        gl_FragColor = vec4(tone, clamp(alpha, 0.0, 1.0));
      }`,
  });

  return {
    material,
    uniforms,
    setCondition(condition: WeatherVisualCondition) {
      // Weather reads only as light: open sun, a flat veil, deeper shade, or a bright whiteout.
      const sky = skies[condition] ?? skies.neutral;
      uniforms.cloud.value = sky.cloud;
      uniforms.lift.value = sky.lift;
      uniforms.shaft.value = sky.shaft;
      uniforms.streak.value = sky.streak;
      uniforms.sparkle.value = sky.sparkle;
    },
  };
}
