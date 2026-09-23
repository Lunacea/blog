<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphResponse, glyphStroke } from "./glyph.ts";

  /** 開閉の符号。閉じているあいだは＋、開くと縦棒が畳まれて−になる。 */
  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphResponse, "disclosure-glyph", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path d="M5 12H19" />
  <path
    class="[transform-box:view-box] [transform-origin:12px_12px] in-data-[state=open]:scale-y-0 [details[open]_&]:scale-y-0"
    d="M12 5V19"
  />
</svg>
