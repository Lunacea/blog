<script lang="ts">
  /**
   * "Thank you!" written as a pointed-pen script: pressured down-strokes and hairline joins,
   * drawn once in writing order.
   */
  const strokes: Array<{ d: string; pressed?: boolean }> = [
    { d: "M18 26C34 17 54 16 72 19" },
    { d: "M47 19C44 37 42 55 45 68", pressed: true },
    { d: "M45 68C49 72 55 72 61 67" },
    { d: "M75 13C72 33 70 52 72 68", pressed: true },
    { d: "M72 45C77 36 87 33 91 40" },
    { d: "M92 42C93 52 91 60 93 68", pressed: true },
    { d: "M93 68C97 72 103 71 108 66" },
    { d: "M115 45C107 36 96 42 98 55" },
    { d: "M98 55C100 65 110 65 113 55", pressed: true },
    { d: "M115 42C114 52 113 62 116 68", pressed: true },
    { d: "M116 68C120 72 126 71 130 66" },
    { d: "M129 45C127 55 126 62 128 68", pressed: true },
    { d: "M128 49C133 39 145 37 148 47" },
    { d: "M148 47C149 57 148 63 150 68", pressed: true },
    { d: "M150 68C154 72 160 71 164 66" },
    { d: "M167 13C164 33 162 53 164 68", pressed: true },
    { d: "M164 48C172 45 179 38 184 28" },
    { d: "M169 51C175 57 179 63 183 68", pressed: true },
    { d: "M205 42C203 55 204 64 210 66" },
    { d: "M210 66C216 66 219 56 220 42", pressed: true },
    { d: "M220 44C219 61 217 78 208 86", pressed: true },
    { d: "M208 86C202 90 195 86 195 81" },
    { d: "M240 50C242 42 251 40 254 47" },
    { d: "M254 47C257 56 250 65 242 62", pressed: true },
    { d: "M242 62C237 60 237 54 239 50" },
    { d: "M268 42C266 54 266 62 272 65" },
    { d: "M272 65C278 66 282 58 283 42", pressed: true },
    { d: "M283 44C282 56 282 63 285 68", pressed: true },
    { d: "M285 68C289 71 294 70 298 66" },
    { d: "M311 18C313 32 313 44 312 52", pressed: true },
    { d: "M310 66C310 67 311 67 311 66", pressed: true },
  ];
</script>

<svg
  class="thank-you-mark relative block w-[min(17rem,52vw)] -skew-x-9 text-canvas [&_path]:fill-none [&_path]:stroke-current [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round] [&_path]:[stroke-dasharray:1] [&_path]:[stroke-dashoffset:1] [&_.hair]:stroke-[1.4] [&_.pressed]:stroke-[4.6] motion-full:animate-thanks-linger motion-full:[&_path]:animate-hand-write"
  viewBox="0 0 330 100"
  aria-hidden="true"
  focusable="false"
  data-thank-you
>
  {#each strokes as stroke, index (index)}
    <path
      class={stroke.pressed ? "pressed" : "hair"}
      d={stroke.d}
      pathLength="1"
      style={`--stroke-order:${index}`}
    />
  {/each}
</svg>
