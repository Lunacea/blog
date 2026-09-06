<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  let { filled = false, class: className = "" }: { filled?: boolean; class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "heart-glyph origin-center", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
  data-filled={filled}
>
  <path
    class={cn("heart-shape", filled && "fill-current!")}
    d="M12 20.2C12 20.2 3.6 14.6 3.6 9.2C3.6 6.4 5.8 4.4 8.2 4.4C9.9 4.4 11.3 5.4 12 6.8C12.7 5.4 14.1 4.4 15.8 4.4C18.2 4.4 20.4 6.4 20.4 9.2C20.4 14.6 12 20.2 12 20.2Z"
  />
</svg>
