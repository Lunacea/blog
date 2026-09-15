/**
 * サイト上のすべての液体的な面が共有する語彙。題字・エラー番号・フッタのアドレスは
 * 同じ速度で振動し、同じ慣性で収束する。3つの効果ではなく1つの考え方。
 */
export const liquid = {
  /** 乱された面が振動する角速度（ラジアン毎秒）。 */
  speed: 7.4,
  /** ポインタから離れるにつれ乱れが減衰する急峻さ（面の幅あたり）。 */
  falloff: 7.6,
  /** インクの最大変位（フィルタのユーザ単位）。 */
  scale: 30,
  /** これを下回ると静止と区別できない。フレームループを止め、フィルタも外す。 */
  still: 0.02,
} as const;

/**
 * オープニングのインクと同じ値。サーバ描画に含まれる `opening-ink` フィルタと必ず揃えること。
 */
export const openingInk = {
  baseFrequency: ".004 .011",
  octaves: 3,
  seed: 7,
  x: "-14%",
  y: "-45%",
  width: "128%",
  height: "190%",
} as const;

/**
 * 題字専用のインク。変位マップは本来2軸に押すが、赤チャンネルを中央値で固定して
 * 水平成分を消し、縦方向の裂けだけを残す。縦の周波数を細かくして裂けを字形の一部に留める。
 */
export const verticalInk = {
  baseFrequency: ".005 .03",
  octaves: 2,
  seed: 7,
  x: "-8%",
  y: "-45%",
  width: "116%",
  height: "190%",
  /** 最大変位。1軸しか残らないぶん共通のインクより大きい。 */
  scale: 44,
} as const;

/** 1回の振動の形。割り切れない2つの周波数を重ね、数えられる拍にならないようにする。 */
export function liquidWave(phase: number) {
  return Math.sin(phase) * 0.72 + Math.sin(phase * 1.73 + 1.1) * 0.28;
}

/**
 * 乱れを運ぶ包絡線。フェードではなく減衰バネで、静止位置を通り越して約2秒かけて収束する。
 * 減衰を弱くしているのは意図的（この揺り戻しが重さを表す）。
 */
export function createLiquidSpring(stiffness = 40, damping = 4.4) {
  const rate = Math.sqrt(stiffness);
  let value = 0;
  let velocity = 0;
  return {
    get value() {
      return value;
    },
    get moving() {
      // 次の山の高さは概ね「速度／レート」。位置と速度の両方が見えなくなるまで止めない
      // （ゼロ交差は最速の瞬間なので停止条件に使えない）。
      return Math.abs(value) > liquid.still || Math.abs(velocity) / rate > liquid.still;
    },
    /** 包絡線を `delta` 秒かけて `target` へ運ぶ。 */
    advance(target: number, delta: number) {
      velocity += ((target - value) * stiffness - velocity * damping) * delta;
      value += velocity * delta;
      return value;
    },
    /** ホバーを伴わない到着のための一度きりの push。 */
    kick(amount: number) {
      velocity += amount;
    },
    settle() {
      value = 0;
      velocity = 0;
    },
  };
}

/** 装飾的な面を動かしてよい状態かどうか。 */
export function liquidAllowed() {
  const root = document.documentElement;
  // 描画前スクリプトが OS の設定をこの属性に畳み込む。
  return root.dataset.motion === "full" && root.dataset.homeOpening !== "active" &&
    !document.hidden;
}
