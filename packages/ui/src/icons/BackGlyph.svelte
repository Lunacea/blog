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
    class="[transform-box:view-box] [transform-origin:19.5px_12px] in-[a:hover]:scale-x-125 in-[a:focus-visible]:scale-x-125"
    d="M19.5 12H5.5"
  />
  <path
    class="fill-current! stroke-none! in-[a:hover]:-translate-x-[3px] in-[a:focus-visible]:-translate-x-[3px]"
    d="M11 6.5Q9.8 10.35 5 12Q9.8 13.65 11 17.5Z"
  />
</svg>
