<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "forward-glyph size-(--space-5)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="in-[a:hover]:translate-x-[1.5px] in-[a:focus-visible]:translate-x-[1.5px]"
    d="M4.5 12H18.5"
  />
  <path
    class="in-[a:hover]:translate-x-[1.5px] in-[a:focus-visible]:translate-x-[1.5px]"
    d="M13 6L19 12L13 18"
  />
</svg>
