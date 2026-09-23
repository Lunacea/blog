/**
 * 設定地点の空で太陽がどこにあるか。天候APIには足さず、緯度経度と閲覧時刻から求める。
 * 背景が表すのは地点の空なので、閲覧者のタイムゾーンや位置は使わない。
 *
 * 精度は描画に足る程度（高度で1度前後）の簡略式。
 */

export type Sunlight = {
  /** 朝夕の低い光の量。地平線の少し上で最も強く、真昼と夜は 0。 */
  dusk: number;
  /** 夜の深さ。常用薄明を過ぎると 1。 */
  night: number;
  /** 光の来る向き。-1 は画面の左（東）、1 は右（西）。南を向いて空を見る構図。 */
  side: number;
  /** 光の低さ。真上に近いと 0、地平線に近いと 1。 */
  low: number;
};

const radians = Math.PI / 180;

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 太陽の高度と方位（北から時計回り）を度で返す。 */
export function sunPosition(at: Date, latitude: number, longitude: number) {
  const days = at.getTime() / 86_400_000 - 10_957.5;
  const anomaly = (357.529 + 0.98560028 * days) * radians;
  const meanLongitude = 280.459 + 0.98564736 * days;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * radians;
  const obliquity = (23.439 - 0.00000036 * days) * radians;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealDegrees = 280.46061837 + 360.98564736629 * days + longitude;
  const hourAngle = siderealDegrees * radians - rightAscension;
  const phi = latitude * radians;
  const elevation = Math.asin(
    Math.sin(phi) * Math.sin(declination) +
      Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(phi) - Math.sin(phi) * Math.cos(hourAngle),
  );
  return {
    elevation: elevation / radians,
    azimuth: ((azimuth / radians) + 360) % 360,
  };
}

export function sunlight(at: Date, latitude: number, longitude: number): Sunlight {
  const { elevation, azimuth } = sunPosition(at, latitude, longitude);
  const night = 1 - smoothstep(-6, 2, elevation);
  const dusk = smoothstep(-5, 1, elevation) * (1 - smoothstep(4, 20, elevation));
  return {
    dusk,
    night,
    // 夜は向きを持たない。
    side: Math.sin(azimuth * radians) * -1 * (1 - night),
    low: 1 - smoothstep(8, 55, Math.max(elevation, 0)),
  };
}

/**
 * 時刻の光を時間に沿って保つ。太陽はゆっくりしか動かないので1分ごとに求め、その間はなめらかに
 * 寄せる。最初の1回だけは寄せずに置き、読み込み直後に夕暮れへ染まっていく動きを見せない。
 */
export function createDaylight(
  latitude: number,
  longitude: number,
  clock: () => Date = () => new Date(),
) {
  let goal: Sunlight | undefined;
  let current: Sunlight | undefined;
  let next = 0;
  return {
    update(now: number, delta: number): Sunlight {
      if (!goal || now >= next) {
        next = now + 60_000;
        goal = sunlight(clock(), latitude, longitude);
        current ??= { ...goal };
      }
      const ease = 1 - Math.exp(-delta * 0.4);
      const state = current as Sunlight;
      for (const key of ["dusk", "night", "side", "low"] as const) {
        state[key] += (goal[key] - state[key]) * ease;
      }
      return state;
    },
  };
}

/** 開発時の確認用。ISO 8601 の日時を受け取り、読めなければ undefined。 */
export function parseTimeOverride(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
