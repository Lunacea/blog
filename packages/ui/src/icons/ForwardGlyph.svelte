<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTravelTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTravelTransition, "forward-glyph size-(--space-5)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="[transform-box:view-box] [transform-origin:4.5px_12px] in-[a:hover]:scale-x-125 in-[a:focus-visible]:scale-x-125 in-[a:active]:scale-x-[1.38]"
    d="M4.5 12H18.5"
  />
  <path
    class="in-[a:hover]:translate-x-[3px] in-[a:focus-visible]:translate-x-[3px] in-[a:active]:translate-x-[4.6px]"
    d="M13 6L19 12L13 18"
  />
</svg>
