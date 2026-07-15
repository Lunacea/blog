<script lang="ts">
  import { onMount } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import {
    reactionSummarySchema,
    type Content,
    type ReactionKind,
    type ReactionSummary
  } from "@lunacea/schemas";

  let { content }: { content: Content } = $props();
  let summary = $state<ReactionSummary | null>(null);
  let pending = $state<ReactionKind | null>(null);
  let message = $state("");

  const endpoint = $derived("/api/v1/reactions/" + content.type + "/" + content.slug);

  async function load() {
    try {
      const response = await fetch(endpoint);
      summary = reactionSummarySchema.parse(await response.json());
    } catch {
      message = "リアクションを読み込めませんでした";
    }
  }

  async function toggle(kind: ReactionKind) {
    if (!summary || pending) return;
    const active = !summary.selected.includes(kind);
    pending = kind;
    try {
      const response = await fetch(endpoint + "/" + kind, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error("reaction failed");
      summary = reactionSummarySchema.parse(await response.json());
      message = active ? "リアクションを追加しました" : "リアクションを取り消しました";
    } catch {
      message = "リアクションを更新できませんでした";
    } finally {
      pending = null;
    }
  }

  onMount(() => void load());
</script>

<section class="reactions" aria-labelledby="reaction-heading" data-reveal>
  <div>
    <p class="eyebrow">Response</p>
    <h2 id="reaction-heading">この記録をどう感じましたか</h2>
  </div>
  <div class="buttons">
    {#each siteConfig.reactions as reaction}
      <button
        type="button"
        aria-pressed={summary?.selected.includes(reaction.id) ?? false}
        disabled={!summary || pending !== null}
        onclick={() => void toggle(reaction.id)}
      >
        <span aria-hidden="true">{reaction.emoji}</span>
        {reaction.label}
        <strong>{summary?.counts[reaction.id] ?? 0}</strong>
      </button>
    {/each}
  </div>
  <p class="status" aria-live="polite">{message}</p>
</section>

<style>
  .reactions {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: var(--space-8);
    margin-top: var(--space-20);
    border-block: 1px solid var(--color-line);
    padding-block: var(--space-8);
  }

  h2 {
    margin: 0;
    font-size: var(--text-small);
    font-weight: 520;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-surface);
    cursor: pointer;
  }

  button[aria-pressed="true"] {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  }

  button:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  strong {
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .status {
    grid-column: 2;
    min-height: 1.5rem;
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  @media (max-width: 44rem) {
    .reactions {
      grid-template-columns: 1fr;
    }

    .status {
      grid-column: 1;
    }
  }
</style>
