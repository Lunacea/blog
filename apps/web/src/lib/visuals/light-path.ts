/**
 * 光だまりの行き先。細かいポインタがある環境では光はポインタを追い、置かれていなければ自分で
 * 漂う。タッチ環境では光は指ではなくページに応答し、読み進めると動き、手を止めるとゆっくり
 * 漂い始める。座標は画面に対する割合で、y は下から上。DOM に触れない状態機械。
 */

/** ポインタを置いたあと、自動の漂いへ戻るまでの時間。置かれた位置はその間そのまま保つ。 */
const guidedFor = 9000;
/** スクロールが止まってから「手を止めた」とみなすまでの時間。 */
const settleAfter = 1600;

/** 繰り返しに見えないよう、周期の揃わない正弦を重ねた不均等な軌跡。 */
export function wander(seconds: number, scale: number): [number, number] {
  return [
    (Math.sin(seconds * 0.31) * 0.3 + Math.sin(seconds * 0.12 + 1.1) * 0.12) * scale,
    (Math.cos(seconds * 0.23) * 0.26 + Math.sin(seconds * 0.097 + 0.4) * 0.1) * scale,
  ];
}

export function createLightPath({ finePointer }: { finePointer: boolean }) {
  let target: [number, number] = [0.32, 0.72];
  let guidedUntil = 0;
  let lastScroll = -Infinity;
  let progress = 0;
  /** 0 は読んでいる最中、1 は手を止めている。数秒かけて移り、再開ではすぐ手放す。 */
  let calm = 0;

  return {
    pointer(x: number, y: number, now: number) {
      target = [x, y];
      guidedUntil = now + guidedFor;
    },
    leave() {
      guidedUntil = 0;
    },
    scrolled(now: number, share: number) {
      lastScroll = now;
      progress = share;
    },
    /** 誰も光を導いていないか。待機中の出来事はこのときだけ起こす。 */
    idle(now: number) {
      return finePointer ? now > guidedUntil : calm > 0.5;
    },
    /** 光が行き先へ寄る速さ（1/秒）。指がない環境では遅くして、ページの動きに従わせる。 */
    followRate: finePointer ? 3.4 : 2.2,
    update(seconds: number, now: number, delta: number): [number, number] {
      if (finePointer) {
        if (now > guidedUntil) {
          const [x, y] = wander(seconds, 1);
          target = [0.5 + x, 0.5 + y];
        }
        return target;
      }
      const settled = now - lastScroll > settleAfter;
      calm += ((settled ? 1 : 0) - calm) * (1 - Math.exp(-delta * (settled ? 0.45 : 2.4)));
      const [x, y] = wander(seconds, 0.2 + calm * 0.6);
      target = [
        0.5 + Math.sin(progress * 2.4 - 0.7) * 0.36 * (1 - calm * 0.35) + x,
        0.9 - progress * 0.78 + y,
      ];
      return target;
    },
  };
}
