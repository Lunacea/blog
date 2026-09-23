<script lang="ts">
  import { SearchGlyph } from "@lunacea/ui/icons";
  import { Input } from "@lunacea/ui/primitives";

  /** 記事の検索フォーム。GET で送るので JavaScript がなくても使える。 */
  let { value = "" }: { value?: string } = $props();
  const id = $props.id();
</script>

<div class="w-full max-w-(--container-grid-wide)">
  <form
    class="grid grid-cols-[minmax(0,1fr)_var(--control-size)] items-stretch"
    action="/articles"
    method="GET"
    role="search"
    data-sveltekit-keepfocus
  >
    <label class="sr-only" for={id}>記事を検索</label>
    <Input
      class="peer min-h-control rounded-sharp border-r-0 border-rule px-3 text-(length:--text-small) focus-visible:border-ink focus-visible:shadow-none focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-ink"
      {id}
      type="search"
      name="q"
      {value}
      maxlength={120}
      placeholder="キーワードで記事を探す"
      enterkeyhint="search"
    />
    <input type="hidden" name="view" value="list" />
    <!-- フォーカスリングをボタンまで閉じるため、入力欄の右端には罫線を引かない。 -->
    <button
      class="grid size-control cursor-pointer place-items-center border border-rule bg-canvas p-0 text-small text-ink pressable [--press-scale:0.94] peer-focus-visible:border-ink peer-focus-visible:outline-1 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-ink hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas focus-visible:shadow-none focus-visible:outline-1 focus-visible:outline-offset-0"
      type="submit"
      aria-label="記事を検索"
    >
      <SearchGlyph />
    </button>
  </form>
</div>
