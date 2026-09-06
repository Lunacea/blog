<script lang="ts">
  import { Bleed, Cluster, Container, Grid, Section, Split, Stack } from "./index.ts";
</script>

<Section space="compact" aria-labelledby="layout-title">
  <Container>
    <Stack gap="xl">
      <Stack gap="sm">
        <p class="m-0 font-code text-(length:--text-caption) text-quiet">Layout / responsive composition</p>
        <h2 class="m-0 max-w-[15ch] font-editorial text-(length:--text-h2) font-regular leading-tight" id="layout-title">余白から構造を組み立てる</h2>
        <p class="m-0 max-w-2xl text-quiet">各領域は同じspacing vocabularyを共有し、狭い幅では自然に一列へ戻ります。</p>
      </Stack>

      <Cluster gap="sm" align="baseline">
        <span>Cluster</span><strong>baseline</strong><code class="font-code text-(length:--text-caption) text-quiet">gap="sm"</code>
      </Cluster>

      <Grid min="compact" gap="md">
        {#each ["Container", "Section", "Grid"] as label, index}
          <article class="min-h-24 border-t border-rule py-4"><span class="font-code text-(length:--text-caption) text-quiet">0{index + 1}</span><h3 class="mt-3 mb-0 text-(length:--text-h3)">{label}</h3></article>
        {/each}
      </Grid>

      <Split ratio="leading">
        <div class="min-h-40 border-t border-rule py-4"><span class="font-code text-(length:--text-caption) text-quiet">Leading / 2fr</span></div>
        <Stack gap="sm">
          <div class="min-h-24 border-t border-rule py-4"><span class="font-code text-(length:--text-caption) text-quiet">Trailing</span></div>
          <div class="min-h-24 border-t border-rule py-4"><span class="font-code text-(length:--text-caption) text-quiet">Stack</span></div>
        </Stack>
      </Split>

      <Bleed>
        <div class="border-y border-rule bg-panel px-gutter py-4 font-code text-(length:--text-caption) text-quiet">Bleed / viewport-aligned rule</div>
      </Bleed>
    </Stack>
  </Container>
</Section>
