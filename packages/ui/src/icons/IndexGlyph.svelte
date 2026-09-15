<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  /** 線の左端を枠の左端に合わせる。字送りの先頭と揃えたいときに使う。 */
  let { class: className = "", flush = false }: { class?: string; flush?: boolean } = $props();
  const x1 = $derived(flush ? 0.9 : 4.5);
  const x2 = 19.5;
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "index-glyph", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="origin-left in-data-[state=open]:translate-y-[5px] in-data-[state=open]:opacity-0 [details[open]_&]:translate-y-[5px] [details[open]_&]:opacity-0"
    d={`M${x1} 7H${x2}`}
  />
  <path
    class="origin-left scale-x-[0.66] in-data-[state=open]:scale-x-100 [details[open]_&]:scale-x-100"
    d={`M${x1} 12H${x2}`}
  />
  <path
    class="origin-left scale-x-[0.84] in-data-[state=open]:-translate-y-[5px] in-data-[state=open]:opacity-0 [details[open]_&]:-translate-y-[5px] [details[open]_&]:opacity-0"
    d={`M${x1} 17H${x2}`}
  />
</svg>
