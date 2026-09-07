<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, "scroll-glyph h-(--control-size) w-(--space-4)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path class="opacity-45" d="M12 3V21" />
  <path class="scroll-marker motion-full:animate-scroll-indicator" d="M12 4V10" />
</svg>
