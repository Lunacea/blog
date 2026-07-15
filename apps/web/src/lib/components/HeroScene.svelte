<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import HeroObject from "./HeroObject.svelte";

  let {
    quality,
    palette,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
  } = $props();
</script>

<Canvas
  dpr={quality === "high" ? [1, 1.5] : [1, 1.2]}
  renderMode="on-demand"
  shadows={false}
>
  <T.PerspectiveCamera makeDefault position={[0, 0, 5.8]} fov={32} />
  <T.AmbientLight intensity={1.25} color={palette.foreground} />
  <T.DirectionalLight position={[3, 4, 5]} intensity={2.1} color={palette.primary} />
  <T.PointLight position={[-2.4, -1.2, 2.6]} intensity={14} color={palette.accent} />
  <HeroObject {quality} {palette} />
</Canvas>
