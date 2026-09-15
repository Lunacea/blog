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
    class="[transform-box:view-box] [transform-origin:4.5px_12px] in-[a:hover]:scale-x-125 in-[a:focus-visible]:scale-x-125 in-[a:active]:scale-x-[1.38]"
    d="M4.5 12H18.5"
  />
  <path
    class="fill-current! stroke-none! in-[a:hover]:translate-x-[3px] in-[a:focus-visible]:translate-x-[3px] in-[a:active]:translate-x-[4.6px]"
    d="M13 6.5Q14.2 10.35 19 12Q14.2 13.65 13 17.5Z"
  />
</svg>
