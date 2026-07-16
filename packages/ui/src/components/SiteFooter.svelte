<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import GithubIcon from "../icons/GithubIcon.svelte";
</script>

<footer>
  <div class="shell grid">
    <div>
      <p class="label">Lunacea archive</p>
      <p>コード、研究、写真、土地の記憶を、時間とともに残す。</p>
    </div>
    <nav aria-label="外部リンク">
      {#if siteConfig.author.github}
        <a href={siteConfig.author.github} rel="me"><GithubIcon /> GitHub</a>
      {:else}
        <span><GithubIcon /> GitHub 未設定</span>
      {/if}
      <a href="/rss.xml">RSS</a>
      <a href="/sitemap.xml">Sitemap</a>
    </nav>
    <p class="status">
      <span aria-hidden="true"></span>
      {siteConfig.sampleMode ? "System quiet / Sample" : "System quiet / Published"}
    </p>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-12);
    background: var(--color-surface);
  }

  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--space-8);
  }

  p {
    max-width: 32rem;
    margin: var(--space-1) 0;
    color: var(--color-muted);
    font-size: var(--text-small);
  }

  .label {
    color: var(--color-foreground);
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  nav {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
  }

  nav a,
  nav span {
    display: inline-flex;
    min-height: var(--control-size);
    align-items: center;
    gap: var(--space-2);
  }

  .status span {
    display: inline-block;
    width: var(--space-2);
    height: var(--space-2);
    margin-right: var(--space-2);
    border-radius: var(--radius-round);
    background: var(--color-positive);
  }

  @media (max-width: 44rem) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
