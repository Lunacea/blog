<script lang="ts">
  import Iconify from "@iconify/svelte";
  import deno from "@iconify-icons/simple-icons/deno.js";
  import github from "@iconify-icons/simple-icons/github.js";
  import svelte from "@iconify-icons/simple-icons/svelte.js";
  import threedotjs from "@iconify-icons/simple-icons/threedotjs.js";
  import typescript from "@iconify-icons/simple-icons/typescript.js";
  import webgl from "@iconify-icons/simple-icons/webgl.js";
  import accessibility from "@iconify-icons/solar/accessibility-linear.js";
  import arrowRightUp from "@iconify-icons/solar/arrow-right-up-linear.js";
  import bolt from "@iconify-icons/solar/bolt-linear.js";
  import clockCircle from "@iconify-icons/solar/clock-circle-linear.js";
  import cloudRain from "@iconify-icons/solar/cloud-rain-linear.js";
  import cloudSnowfall from "@iconify-icons/solar/cloud-snowfall-linear.js";
  import cloudStorm from "@iconify-icons/solar/cloud-storm-linear.js";
  import cloudSun from "@iconify-icons/solar/cloud-sun-2-linear.js";
  import cloudyMoon from "@iconify-icons/solar/cloudy-moon-linear.js";
  import code from "@iconify-icons/solar/code-linear.js";
  import documentText from "@iconify-icons/solar/document-text-linear.js";
  import fog from "@iconify-icons/solar/fog-linear.js";
  import heart from "@iconify-icons/solar/heart-linear.js";
  import leaf from "@iconify-icons/solar/leaf-linear.js";
  import lightbulb from "@iconify-icons/solar/lightbulb-linear.js";
  import magnifer from "@iconify-icons/solar/magnifer-linear.js";
  import mapPoint from "@iconify-icons/solar/map-point-linear.js";
  import monitor from "@iconify-icons/solar/monitor-linear.js";
  import moon from "@iconify-icons/solar/moon-linear.js";
  import palette from "@iconify-icons/solar/palette-linear.js";
  import sun from "@iconify-icons/solar/sun-2-linear.js";
  import tag from "@iconify-icons/solar/tag-linear.js";

  export type ApprovedIconName =
    | "solar:accessibility-linear"
    | "solar:arrow-right-up-linear"
    | "solar:bolt-linear"
    | "solar:clock-circle-linear"
    | "solar:cloud-rain-linear"
    | "solar:cloud-snowfall-linear"
    | "solar:cloud-storm-linear"
    | "solar:cloud-sun-2-linear"
    | "solar:cloudy-moon-linear"
    | "solar:code-linear"
    | "solar:document-text-linear"
    | "solar:fog-linear"
    | "solar:heart-linear"
    | "solar:leaf-linear"
    | "solar:lightbulb-linear"
    | "solar:magnifer-linear"
    | "solar:map-point-linear"
    | "solar:monitor-linear"
    | "solar:moon-linear"
    | "solar:palette-linear"
    | "solar:sun-2-linear"
    | "solar:tag-linear"
    | "simple-icons:deno"
    | "simple-icons:github"
    | "simple-icons:svelte"
    | "simple-icons:threedotjs"
    | "simple-icons:typescript"
    | "simple-icons:webgl";

  const icons = {
    "solar:accessibility-linear": accessibility,
    "solar:arrow-right-up-linear": arrowRightUp,
    "solar:bolt-linear": bolt,
    "solar:clock-circle-linear": clockCircle,
    "solar:cloud-rain-linear": cloudRain,
    "solar:cloud-snowfall-linear": cloudSnowfall,
    "solar:cloud-storm-linear": cloudStorm,
    "solar:cloud-sun-2-linear": cloudSun,
    "solar:cloudy-moon-linear": cloudyMoon,
    "solar:code-linear": code,
    "solar:document-text-linear": documentText,
    "solar:fog-linear": fog,
    "solar:heart-linear": heart,
    "solar:leaf-linear": leaf,
    "solar:lightbulb-linear": lightbulb,
    "solar:magnifer-linear": magnifer,
    "solar:map-point-linear": mapPoint,
    "solar:monitor-linear": monitor,
    "solar:moon-linear": moon,
    "solar:palette-linear": palette,
    "solar:sun-2-linear": sun,
    "solar:tag-linear": tag,
    "simple-icons:deno": deno,
    "simple-icons:github": github,
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
