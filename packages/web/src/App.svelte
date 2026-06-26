<script lang="ts">
  import { onMount } from "svelte";

  // ステート管理
  let apiStatus = "接続確認中...";
  let isOnline = false;
  let runtimeInfo = "";
  let timestamp = "";

  // 記事取得テスト用ステート
  let articleSlug = "test-article";
  let articleTitle = "取得未確認";
  let articleTags: string[] = [];
  let articleStatus = "未ロード";

  // ① Hono API の基本疎通チェック
  async function checkConnection() {
    try {
      // 💡 vite.config.ts のプロキシにより、開発時・本番時ともに CORS 無しで疎通します
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        apiStatus = "オンライン (正常疎通中)";
        isOnline = true;
        runtimeInfo = data.runtime;
        timestamp = new Date(data.timestamp).toLocaleString();
      } else {
        apiStatus = `HTTPエラー (${res.status})`;
      }
    } catch (e) {
      apiStatus = "API サーバーと通信できません (オフライン)";
      isOnline = false;
    }
  }

  // ② 記事取得APIテスト（posts から articles への変更が反映されているか検証）
  async function testFetchArticle() {
    articleStatus = "ロード中...";
    try {
      const res = await fetch(`/api/articles/${articleSlug}`);
      if (res.ok) {
        const data = await res.json();
        // 取得したメタデータのバインド
        articleTitle = data.metadata?.title || "タイトルなし";
        articleTags = data.metadata?.tags || [];
        articleStatus = "取得成功！ (Deno KVからロード完了)";
      } else if (res.status === 404) {
        articleStatus = "404 Not Found (モックデータをKVに投入してください)";
      } else {
        articleStatus = `エラーが発生しました (${res.status})`;
      }
    } catch (e) {
      articleStatus = "通信エラー";
    }
  }

  onMount(() => {
    checkConnection();
  });
</script>

<main
  class="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6"
>
  <div
    class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6"
  >
    <!-- ヘッダー -->
    <div class="text-center">
      <h1 class="text-2xl font-extrabold tracking-tight text-white">
        blog.lunacea.jp
      </h1>
      <p class="text-xs text-slate-400 mt-1">
        Deno 2.x ワークスペース ＆ 単一デプロイ疎通デバッガー
      </p>
    </div>

    <!-- 1. API サーバー疎通ステータス -->
    <div
      class="py-4 px-6 rounded-xl bg-slate-950/60 border border-slate-800/80"
    >
      <p
        class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2"
      >
        ① 基本 API 疎通状況
      </p>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            {#if isOnline}
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"
              ></span>
            {:else}
              <span
                class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"
              ></span>
            {/if}
          </span>
          <span class="text-sm font-mono font-medium text-slate-200"
            >{apiStatus}</span
          >
        </div>
        {#if isOnline}
          <button
            onclick={checkConnection}
            class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
          >
            再チェック
          </button>
        {/if}
      </div>

      {#if isOnline}
        <div
          class="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400"
        >
          <div>Runtime: <span class="text-indigo-400">{runtimeInfo}</span></div>
          <div class="text-right">
            Time: <span class="text-slate-300">{timestamp}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- 2. Articles モジュール・Deno KV 接続テスト -->
    <div
      class="py-4 px-6 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
    >
      <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        ② Articles & Deno KV 連携デバッグ
      </p>

      <div class="flex gap-2">
        <input
          type="text"
          bind:value={articleSlug}
          class="flex-1 text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          placeholder="article-slug-here"
        />
        <button
          onclick={testFetchArticle}
          class="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
        >
          APIテスト実行
        </button>
      </div>

      <div
        class="p-3 bg-slate-900/80 rounded-lg border border-slate-800/50 space-y-2"
      >
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">接続ステータス:</span>
          <span class="font-mono font-bold text-slate-300">{articleStatus}</span
          >
        </div>
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">取得タイトル:</span>
          <span class="font-bold text-slate-200">{articleTitle}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">タグ一覧:</span>
          <div class="flex gap-1">
            {#if articleTags.length > 0}
              {#each articleTags as tag}
                <span
                  class="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded text-indigo-300 font-mono"
                  >#{tag}</span
                >
              {/each}
            {:else}
              <span class="text-slate-600">なし</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- ディレクトリ統合メモ -->
    <div class="text-center text-[10px] text-slate-600 font-mono">
      Port Config: Vite (5173 ➔ proxy ➔ 8000) | Deno (8000)
    </div>
  </div>
</main>
