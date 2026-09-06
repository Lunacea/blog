/**
 * One stroke language for the site's own glyphs, matching the Display (motion) glyph:
 * a 24 unit box, 1.75 non-scaling stroke, round ends, and short state transitions.
 */
export const glyphFrame = "block size-(--space-6) overflow-visible";
export const glyphStroke =
  "[&_path]:fill-none [&_path]:stroke-current [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round] [&_path]:stroke-[1.75] [&_path]:[vector-effect:non-scaling-stroke]";
export const glyphTransition =
  "[&_path]:transition-[translate,scale,opacity,fill] [&_path]:duration-(--motion-duration-fast) [&_path]:ease-standard motion-reduced:[&_path]:duration-(--motion-duration-immediate) motion-off:[&_path]:duration-(--motion-duration-immediate)";
