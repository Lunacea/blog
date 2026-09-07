<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "./glyph.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "index-glyph", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    class="origin-left in-data-[state=open]:translate-y-[5px] in-data-[state=open]:opacity-0 [details[open]_&]:translate-y-[5px] [details[open]_&]:opacity-0"
    d="M4.5 7H19.5"
  />
  <path
    class="origin-left scale-x-[0.66] in-data-[state=open]:scale-x-100 [details[open]_&]:scale-x-100"
    d="M4.5 12H19.5"
  />
  <path
    class="origin-left scale-x-[0.84] in-data-[state=open]:-translate-y-[5px] in-data-[state=open]:opacity-0 [details[open]_&]:-translate-y-[5px] [details[open]_&]:opacity-0"
    d="M4.5 17H19.5"
  />
</svg>
