<script lang="ts">
  import Iconify from "@iconify/svelte";
  import deno from "@iconify-icons/simple-icons/deno.js";
  import github from "@iconify-icons/simple-icons/github.js";
  import x from "@iconify-icons/simple-icons/x.js";
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
  import letter from "@iconify-icons/solar/letter-linear.js";
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
    | "solar:letter-linear"
    | "solar:magnifer-linear"
    | "solar:list-outline"
    | "solar:link-round-linear"
    | "solar:palette-linear"
    | "solar:restart-linear"
    | "solar:tag-linear"
    | "solar:widget-4-linear"
    | "simple-icons:deno"
    | "simple-icons:github"
    | "simple-icons:x"
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
    "solar:letter-linear": letter,
    "solar:magnifer-linear": magnifer,
    "solar:list-outline": list,
    "solar:link-round-linear": linkRound,
    "solar:palette-linear": palette,
    "solar:restart-linear": restart,
    "solar:tag-linear": tag,
    "solar:widget-4-linear": widget,
    "simple-icons:deno": deno,
    "simple-icons:github": github,
    "simple-icons:x": x,
    "simple-icons:svelte": svelte,
    "simple-icons:threedotjs": threedotjs,
    "simple-icons:typescript": typescript,
    "simple-icons:webgl": webgl,
  } as const;

  /** 図像は常に装飾。名前は隣の文字か、それを包む操作子のアクセシブルネームが持つ。 */
  let { name, class: className = "" }: { name: ApprovedIconName; class?: string } = $props();
</script>

<Iconify icon={icons[name]} class={className} aria-hidden="true" />
