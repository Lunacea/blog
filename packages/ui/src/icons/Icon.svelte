<script lang="ts">
  import Iconify from "@iconify/svelte";
  import deno from "@iconify-icons/simple-icons/deno.js";
  import github from "@iconify-icons/simple-icons/github.js";
  import playwright from "@iconify-icons/simple-icons/playwright.js";
  import sharp from "@iconify-icons/simple-icons/sharp.js";
  import storybook from "@iconify-icons/simple-icons/storybook.js";
  import tailwindcss from "@iconify-icons/simple-icons/tailwindcss.js";
  import vite from "@iconify-icons/simple-icons/vite.js";
  import vitest from "@iconify-icons/simple-icons/vitest.js";
  import x from "@iconify-icons/simple-icons/x.js";
  import zod from "@iconify-icons/simple-icons/zod.js";
  import svelte from "@iconify-icons/simple-icons/svelte.js";
  import threedotjs from "@iconify-icons/simple-icons/threedotjs.js";
  import typescript from "@iconify-icons/simple-icons/typescript.js";
  import webgl from "@iconify-icons/simple-icons/webgl.js";
  import accessibility from "@iconify-icons/solar/accessibility-linear.js";
  import bolt from "@iconify-icons/solar/bolt-linear.js";
  import cloudSun from "@iconify-icons/solar/cloud-sun-2-linear.js";
  import checkCircle from "@iconify-icons/solar/check-circle-linear.js";
  import code from "@iconify-icons/solar/code-linear.js";
  import copy from "@iconify-icons/solar/copy-linear.js";
  import documentText from "@iconify-icons/solar/document-text-linear.js";
  import heartBold from "@iconify-icons/solar/heart-bold.js";
  import heart from "@iconify-icons/solar/heart-linear.js";
  import leaf from "@iconify-icons/solar/leaf-linear.js";
  import letter from "@iconify-icons/solar/letter-linear.js";
  import lightbulb from "@iconify-icons/solar/lightbulb-linear.js";
  import magnifer from "@iconify-icons/solar/magnifer-linear.js";
  import list from "@iconify-icons/solar/list-outline.js";
  import linkRound from "@iconify-icons/solar/link-round-linear.js";
  import palette from "@iconify-icons/solar/palette-linear.js";
  import restart from "@iconify-icons/solar/restart-linear.js";
  import tag from "@iconify-icons/solar/tag-linear.js";
  import widget from "@iconify-icons/solar/widget-4-linear.js";

  export type ApprovedIconName =
    | "solar:accessibility-linear"
    | "solar:bolt-linear"
    | "solar:cloud-sun-2-linear"
    | "solar:check-circle-linear"
    | "solar:code-linear"
    | "solar:copy-linear"
    | "solar:document-text-linear"
    | "solar:heart-bold"
    | "solar:heart-linear"
    | "solar:leaf-linear"
    | "solar:letter-linear"
    | "solar:lightbulb-linear"
    | "solar:magnifer-linear"
    | "solar:list-outline"
    | "solar:link-round-linear"
    | "solar:palette-linear"
    | "solar:restart-linear"
    | "solar:tag-linear"
    | "solar:widget-4-linear"
    | "simple-icons:deno"
    | "simple-icons:github"
    | "simple-icons:playwright"
    | "simple-icons:sharp"
    | "simple-icons:storybook"
    | "simple-icons:tailwindcss"
    | "simple-icons:vite"
    | "simple-icons:vitest"
    | "simple-icons:x"
    | "simple-icons:zod"
    | "simple-icons:svelte"
    | "simple-icons:threedotjs"
    | "simple-icons:typescript"
    | "simple-icons:webgl";

  const icons = {
    "solar:accessibility-linear": accessibility,
    "solar:bolt-linear": bolt,
    "solar:cloud-sun-2-linear": cloudSun,
    "solar:check-circle-linear": checkCircle,
    "solar:code-linear": code,
    "solar:copy-linear": copy,
    "solar:document-text-linear": documentText,
    "solar:heart-bold": heartBold,
    "solar:heart-linear": heart,
    "solar:leaf-linear": leaf,
    "solar:letter-linear": letter,
    "solar:lightbulb-linear": lightbulb,
    "solar:magnifer-linear": magnifer,
    "solar:list-outline": list,
    "solar:link-round-linear": linkRound,
    "solar:palette-linear": palette,
    "solar:restart-linear": restart,
    "solar:tag-linear": tag,
    "solar:widget-4-linear": widget,
    "simple-icons:deno": deno,
    "simple-icons:github": github,
    "simple-icons:playwright": playwright,
    "simple-icons:sharp": sharp,
    "simple-icons:storybook": storybook,
    "simple-icons:tailwindcss": tailwindcss,
    "simple-icons:vite": vite,
    "simple-icons:vitest": vitest,
    "simple-icons:x": x,
    "simple-icons:zod": zod,
    "simple-icons:svelte": svelte,
    "simple-icons:threedotjs": threedotjs,
    "simple-icons:typescript": typescript,
    "simple-icons:webgl": webgl,
  } as const;

  let {
    name,
    decorative = true,
    label,
    class: className = "",
    dataIcon,
  }: {
    name: ApprovedIconName;
    decorative?: boolean;
    label?: string;
    class?: string;
    dataIcon?: "inline-start" | "inline-end";
  } = $props();
</script>

<Iconify
  icon={icons[name]}
  class={className}
  data-icon={dataIcon ?? ""}
  data-icon-name={name}
  aria-hidden={decorative ? "true" : undefined}
  aria-label={decorative ? undefined : label}
  role={decorative ? undefined : "img"}
/>
