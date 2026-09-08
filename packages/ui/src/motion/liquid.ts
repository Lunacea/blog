/**
 * One vocabulary for every liquid surface on the site. The masthead, the error number and the
 * footer address are all the same wet ink the opening arrives in, so they ring at the same rate
 * and keep the same inertia once the pointer leaves — one idea, not three effects.
 */
export const liquid = {
  /** Radians per second the surface oscillates at once it has been disturbed. */
  speed: 7.4,
  /**
   * How steeply the disturbance dies away from the pointer, per surface width. Steep, so what
   * moves is the ink the cursor is actually on and a little of what stands next to it.
   */
  falloff: 7.6,
  /** Peak displacement of the ink, in the filter's user units. */
  scale: 30,
  /**
   * Below this the surface is indistinguishable from still: the frame loop lets go, and a letter
   * this far from the disturbance is handed back its plain glyph rather than paying for a filter
   * that would displace it by a fraction of a pixel.
   */
  still: 0.02,
} as const;

/**
 * The opening's ink, to the number. Every liquid surface reaches for the same turbulence, so a
 * letter disturbed by the pointer warps exactly the way it did when the masthead arrived — the
 * effect is the opening continuing, not a second one resembling it. Keep these in step with the
 * `opening-ink` filter that ships with the server-rendered page.
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
 * The masthead's own ink, which moves along one axis only. A displacement map pushes in both at
 * once, and across a whole word that reads as the letters swelling together — the same wobble
 * everywhere, which is the least interesting thing ink can do. Holding the red channel at its
 * midpoint kills the horizontal term outright, so all that is left is the letter tearing along
 * its own height, and a far finer vertical frequency keeps each tear local to a part of the glyph
 * rather than lifting the whole of it.
 */
export const verticalInk = {
  baseFrequency: ".005 .03",
  octaves: 2,
  seed: 7,
  x: "-8%",
  y: "-45%",
  width: "116%",
  height: "190%",
  /** Peak displacement, in filter user units. Higher than the shared ink: one axis is left. */
  scale: 44,
} as const;

/**
 * The shape of one oscillation. Two frequencies that do not divide into each other, so the
 * surface never settles onto a beat the eye can count — a single sine reads as a spring rather
 * than as something wet.
 */
export function liquidWave(phase: number) {
  return Math.sin(phase) * 0.72 + Math.sin(phase * 1.73 + 1.1) * 0.28;
}

/**
 * The envelope that carries a disturbance: a damped spring rather than a fade. Released, it runs
 * past its rest and rings back through it over about two seconds, which is the inertia a
 * body of liquid has and an exponential decay does not. Lightly damped on purpose — the ringing
 * is the whole point, and a surface that cut off the moment the pointer left would read as a
 * switch rather than as something with weight.
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
      // The next crest of a lightly damped spring stands about velocity over its rate high, so
      // the frame loop lets go only once neither the surface nor what it is about to do can be
      // seen — never on a zero crossing, which is the fastest the surface ever moves.
      return Math.abs(value) > liquid.still || Math.abs(velocity) / rate > liquid.still;
    },
    /** Carry the envelope toward `target` across `delta` seconds. */
    advance(target: number, delta: number) {
      velocity += ((target - value) * stiffness - velocity * damping) * delta;
      value += velocity * delta;
      return value;
    },
    /** A single push, for an arrival that nothing is hovering. */
    kick(amount: number) {
      velocity += amount;
    },
    settle() {
      value = 0;
      velocity = 0;
    },
  };
}

/** Whether the document currently allows a decorative surface to move at all. */
export function liquidAllowed() {
  const root = document.documentElement;
  // The pre-paint script folds OS reduced motion and forced colours into this one attribute, and
  // the opening owns the wordmark until it hands it back.
  return root.dataset.motion === "full" && root.dataset.homeOpening !== "active" &&
    !document.hidden;
}
