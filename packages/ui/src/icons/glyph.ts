/** 自前グリフの共通ストローク：24 単位の枠、非スケールの 1.75 ストローク、丸端。 */
export const glyphFrame = "block size-(--space-6) overflow-visible";
export const glyphStroke =
  "[&_path]:fill-none [&_path]:stroke-current [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round] [&_path]:stroke-[1.75] [&_path]:[vector-effect:non-scaling-stroke]";
export const glyphTransition =
  "[&_path]:transition-[translate,scale,opacity,fill] [&_path]:duration-(--motion-duration-hover) [&_path]:ease-signature motion-reduced:[&_path]:duration-(--motion-duration-immediate) motion-off:[&_path]:duration-(--motion-duration-immediate)";
/** 矢印は移動距離が大きいため、乗っている面と同じバネのタイミングを使う。 */
export const glyphTravelTransition =
  "[&_path]:transition-[translate,scale,opacity,fill] [&_path]:duration-(--motion-duration-base) [&_path]:ease-spring motion-reduced:[&_path]:duration-(--motion-duration-immediate) motion-off:[&_path]:duration-(--motion-duration-immediate)";
