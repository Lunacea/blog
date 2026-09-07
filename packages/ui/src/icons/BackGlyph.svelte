<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "back-glyph size-(--space-5)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="in-[a:hover]:-translate-x-[1.5px] in-[a:focus-visible]:-translate-x-[1.5px]"
    d="M19.5 12H5.5"
  />
  <path
    class="in-[a:hover]:-translate-x-[1.5px] in-[a:focus-visible]:-translate-x-[1.5px]"
    d="M11 6L5 12L11 18"
  />
</svg>
