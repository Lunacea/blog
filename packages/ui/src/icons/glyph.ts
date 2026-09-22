/** 自前グリフの共通ストローク：24 単位の枠、非スケールの丸端。太さは --glyph-stroke で乗せる面に合わせる。 */
export const glyphFrame = "block size-(--space-6) overflow-visible";
export const glyphStroke =
  "[&_path]:fill-none [&_path]:stroke-current [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round] [&_path]:[stroke-width:var(--glyph-stroke,1.75)] [&_path]:[vector-effect:non-scaling-stroke]";
/** 押されたことへの返事として切り替わるグリフ。時間とカーブだけ response の対に差し替える。 */
export const glyphResponse =
  "[&_path]:transition-[translate,scale,opacity,fill] [&_path]:duration-(--motion-duration-response) [&_path]:ease-response motion-reduced:[&_path]:duration-(--motion-duration-immediate) motion-off:[&_path]:duration-(--motion-duration-immediate)";
export const glyphTransition =
  "[&_path]:transition-[translate,scale,opacity,fill] [&_path]:duration-(--motion-duration-base) [&_path]:ease-signature motion-reduced:[&_path]:duration-(--motion-duration-immediate) motion-off:[&_path]:duration-(--motion-duration-immediate)";
