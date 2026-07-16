<script lang="ts">
  let {
    assetId,
    role,
    aspectRatio,
    preferredFileType,
    accessibilityDescription,
    transparencyRequired
  }: {
    assetId: string;
    role: string;
    aspectRatio: string;
    preferredFileType: string;
    accessibilityDescription: string;
    transparencyRequired: boolean;
  } = $props();

  const accessibleName = $derived(`${role}用の画像プレースホルダー。アセットID ${assetId}`);
</script>

<div class="asset-placeholder" role="img" aria-label={accessibleName}>
  <dl>
    <div><dt>Asset</dt><dd>{assetId}</dd></div>
    <div><dt>Role</dt><dd>{role}</dd></div>
    <div><dt>Ratio</dt><dd>{aspectRatio}</dd></div>
    <div><dt>File</dt><dd>{preferredFileType}</dd></div>
    <div><dt>Alt</dt><dd>{accessibilityDescription}</dd></div>
    <div><dt>Alpha</dt><dd>{transparencyRequired ? "Required" : "Not required"}</dd></div>
  </dl>
</div>

<style>
  .asset-placeholder {
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
    place-items: end start;
    border: 1px solid var(--color-line);
    background:
      linear-gradient(135deg, transparent 49.8%, var(--color-line) 50%, transparent 50.2%),
      color-mix(in srgb, var(--color-surface) 56%, transparent);
  }

  .asset-placeholder::before {
    position: absolute;
    inset: var(--space-5);
    border: 1px solid var(--color-line);
    content: "";
  }

  dl {
    position: relative;
    display: grid;
    max-width: calc(100% - var(--space-6));
    gap: var(--space-1);
    margin: var(--space-3);
    padding: var(--space-2);
    background: var(--color-background);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
  }

  dl div {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr);
    gap: var(--space-2);
  }

  dt,
  dd {
    overflow-wrap: anywhere;
  }

  dt {
    color: var(--color-foreground);
    text-transform: uppercase;
  }

  dd {
    margin: 0;
  }
</style>
