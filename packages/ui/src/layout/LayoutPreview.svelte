<script lang="ts">
  import { Bleed, Cluster, Container, Grid, Section, Split, Stack } from "./index.ts";
</script>

<Section space="compact" aria-labelledby="layout-title">
  <Container>
    <Stack gap="xl">
      <Stack gap="sm">
        <p class="eyebrow">Layout / responsive composition</p>
        <h2 id="layout-title">余白から構造を組み立てる</h2>
        <p class="lead">各領域は同じspacing vocabularyを共有し、狭い幅では自然に一列へ戻ります。</p>
      </Stack>

      <Cluster gap="sm" align="baseline">
        <span>Cluster</span><strong>baseline</strong><code>gap="sm"</code>
      </Cluster>

      <Grid min="compact" gap="md">
        {#each ["Container", "Section", "Grid"] as label, index}
          <article class="sample"><span>0{index + 1}</span><h3>{label}</h3></article>
        {/each}
      </Grid>

      <Split ratio="leading">
        <div class="sample tall"><span>Leading / 2fr</span></div>
        <Stack gap="sm">
          <div class="sample"><span>Trailing</span></div>
          <div class="sample"><span>Stack</span></div>
        </Stack>
      </Split>

      <Bleed>
        <div class="bleed-sample">Bleed / viewport-aligned rule</div>
      </Bleed>
    </Stack>
  </Container>
</Section>

<style>
  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    max-width: 15ch;
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    line-height: var(--leading-tight);
  }

  .lead {
    max-width: 42rem;
    color: var(--color-muted);
  }

  .eyebrow,
  code,
  .sample span,
  .bleed-sample {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .sample {
    min-height: var(--space-24);
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-4);
  }

  .sample h3 {
    margin-top: var(--space-3);
    font-size: var(--text-h3);
  }

  .sample.tall {
    min-height: var(--space-40);
  }

  .bleed-sample {
    border-block: 1px solid var(--color-line);
    padding: var(--space-4) var(--layout-gutter);
    background: var(--color-surface);
  }
</style>
