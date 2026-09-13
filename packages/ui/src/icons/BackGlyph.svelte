<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTravelTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTravelTransition, "back-glyph size-(--space-5)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="[transform-box:view-box] [transform-origin:19.5px_12px] in-[a:hover]:scale-x-125 in-[a:focus-visible]:scale-x-125"
    d="M19.5 12H5.5"
  />
  <path
    class="in-[a:hover]:-translate-x-[3px] in-[a:focus-visible]:-translate-x-[3px]"
    d="M11 6L5 12L11 18"
  />
</svg>
