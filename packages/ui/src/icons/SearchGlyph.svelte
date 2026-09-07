<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "search-glyph", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path d="M10.6 4.4A6.2 6.2 0 1 0 10.6 16.8A6.2 6.2 0 1 0 10.6 4.4Z" />
  <path
    class="search-handle origin-center in-[button:hover]:translate-x-[1px] in-[button:hover]:translate-y-[1px] in-[button:focus-visible]:translate-x-[1px] in-[button:focus-visible]:translate-y-[1px]"
    d="M15.2 15.2L19.8 19.8"
  />
</svg>
