import type { WeatherVisualCondition } from "./weather-visual.ts";

/**
 * 誰も触れていない間だけ起こる、背景の一時的な出来事。不規則な間隔で1つずつ起こし、包絡線は
 * 両端がなめらかに 0 へ着く。途中で操作が始まっても、始まった出来事は最後まで流して終える。
 * DOM にも WebGL にも触れない状態機械で、シェーダーへ渡す値だけを返す。
 */

export type PulseKind = "bloom" | "veil" | "clearing" | "ripple" | "gust";

export const pulseKinds: readonly PulseKind[] = ["bloom", "veil", "clearing", "ripple", "gust"];

/**
 * 天候に合う出来事を多めに選ぶ。晴れは光が開き、曇りは雲影が渡るか雲間から光が差し、
 * 雨は水面が揺れ、雪は雪煙が流れる。重みの合計は 1。
 */
export const moods: Record<WeatherVisualCondition, ReadonlyArray<[PulseKind, number]>> = {
  clear: [["bloom", 0.65], ["veil", 0.35]],
  neutral: [["bloom", 0.4], ["veil", 0.35], ["clearing", 0.25]],
  cloudy: [["veil", 0.45], ["clearing", 0.4], ["bloom", 0.15]],
  rain: [["ripple", 0.75], ["veil", 0.25]],
  snow: [["gust", 0.7], ["veil", 0.3]],
};

/** シェーダーへ渡す値。強さが 0 の出来事は描かれない。 */
export type PulseFrame = {
  bloom: number;
  veil: { x: number; y: number; strength: number; size: number };
  ring: { x: number; y: number; radius: number; strength: number };
  clearing: { x: number; y: number; strength: number };
  gust: { x: number; y: number; strength: number };
};

type Pulse = {
  kind: PulseKind;
  start: number;
  duration: number;
  strength: number;
  size: number;
  from: [number, number];
  to: [number, number];
};

export function quietFrame(): PulseFrame {
  return {
    bloom: 0,
    veil: { x: -1, y: -1, strength: 0, size: 0.66 },
    ring: { x: -1, y: -1, radius: 0, strength: 0 },
    clearing: { x: -1, y: -1, strength: 0 },
    gust: { x: -1, y: -1, strength: 0 },
  };
}

export function pickPulse(condition: WeatherVisualCondition, roll: number): PulseKind {
  const choices = moods[condition] ?? moods.neutral;
  let remaining = roll;
  for (const [kind, weight] of choices) {
    remaining -= weight;
    if (remaining <= 0) return kind;
  }
  return choices[0][0];
}

/** 両端で 0、中央で 1。始まりと終わりに段差を作らない。 */
export const envelope = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 2;

export function createAmbientPulses({
  random = Math.random,
  forced,
}: {
  random?: () => number;
  /** 開発時の確認用。常にこの出来事を選び、間隔を詰める。 */
  forced?: PulseKind;
} = {}) {
  const between = (low: number, high: number) => low + random() * (high - low);
  let condition: WeatherVisualCondition = "neutral";
  let pulse: Pulse | undefined;
  let next = 0;
  const wait = (now: number, low: number, high: number) => {
    next = now + (forced ? 600 : between(low, high));
  };

  const spawn = (now: number): Pulse => {
    const kind = forced ?? pickPulse(condition, random());
    const base = { kind, start: now, size: 0.66 };
    const here: [number, number] = [between(0.18, 0.82), between(0.2, 0.8)];
    if (kind === "bloom") {
      return {
        ...base,
        from: here,
        to: here,
        duration: between(4500, 7000),
        strength: between(0.55, 1),
      };
    }
    if (kind === "ripple") {
      return {
        ...base,
        from: here,
        to: here,
        duration: between(5000, 7000),
        strength: between(0.6, 1),
      };
    }
    // 移ろう出来事は向きを決める。雲間はその場からわずかに、雲影と雪煙は画面を横切る。
    const angle = random() * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    if (kind === "clearing") {
      return {
        ...base,
        from: here,
        to: [here[0] + dx * 0.22, here[1] + dy * 0.16],
        duration: between(9000, 13000),
        strength: between(0.6, 1),
      };
    }
    const offset = between(-0.25, 0.25);
    const from: [number, number] = [0.5 - dx * 0.95 - dy * offset, 0.5 - dy * 0.95 + dx * offset];
    const to: [number, number] = [0.5 + dx * 0.95 - dy * offset, 0.5 + dy * 0.95 + dx * offset];
    if (kind === "gust") {
      return { ...base, from, to, duration: between(7000, 10000), strength: between(0.6, 1) };
    }
    return {
      ...base,
      from,
      to,
      size: between(0.45, 0.9),
      duration: between(8000, 12000),
      strength: between(0.55, 0.9),
    };
  };

  return {
    setCondition(next: WeatherVisualCondition) {
      condition = next;
    },
    /** 止まっていた間の時間で包絡線が跳ばないよう、途中の出来事は捨てて改めて待つ。 */
    reset(now: number) {
      pulse = undefined;
      wait(now, 3000, 7000);
    },
    update(now: number, idle: boolean): PulseFrame {
      const frame = quietFrame();
      if (!pulse && idle && now >= next) pulse = spawn(now);
      if (!pulse) return frame;
      const t = (now - pulse.start) / pulse.duration;
      if (t >= 1) {
        pulse = undefined;
        wait(now, 5000, 12000);
        return frame;
      }
      const strength = envelope(t) * pulse.strength;
      const x = pulse.from[0] + (pulse.to[0] - pulse.from[0]) * t;
      const y = pulse.from[1] + (pulse.to[1] - pulse.from[1]) * t;
      switch (pulse.kind) {
        case "bloom":
          frame.bloom = strength;
          break;
        case "ripple":
          // 水面の輪は落ちた瞬間に立ち、広がりながらゆっくり消える。
          frame.ring = {
            x,
            y,
            radius: 0.04 + t * 0.95,
            strength: Math.min(1, t * 8) * (1 - t) ** 1.5 * pulse.strength,
          };
          break;
        case "clearing":
          frame.clearing = { x, y, strength };
          break;
        case "gust":
          frame.gust = { x, y, strength };
          break;
        case "veil":
          frame.veil = { x, y, strength, size: pulse.size };
      }
      return frame;
    },
  };
}

export function parsePulseOverride(value: string | null): PulseKind | undefined {
  return pulseKinds.find((kind) => kind === value);
}
