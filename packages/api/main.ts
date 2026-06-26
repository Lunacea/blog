import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

const kv = await Deno.openKv();

const testSlug = "test-article";
await kv.set(["articles", testSlug], {
  slug: testSlug,
  metadata: {
    title: "Vite & Deno 2.x ハイブリッド構成の疎通テスト記事",
    date: new Date().toISOString().split("T")[0],
    tags: ["deno", "svelte5", "hono"],
    description: "このデータは Deno KV からロードされています。",
  },
  htmlContent: "<p>Deno KV への書き込みと読み込みが正常に稼働しています。</p>",
  hasCustomUI: false,
});

// ヘルスチェックAPI
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    runtime: "Deno " + Deno.version.deno,
    timestamp: new Date().toISOString(),
  });
});

// 記事取得 API
app.get("/api/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const article = await kv.get(["articles", slug]);

  if (!article.value) {
    return c.json({ error: "Article not found" }, 404);
  }
  return c.json(article.value);
});

// コメント投稿 API
app.post("/api/comments", async (c) => {
  const body = await c.req.json();
  const { articleId, name, content } = body;

  if (!articleId || !name || !content) {
    return c.json({ error: "Missing fields" }, 400);
  }

  const commentId = crypto.randomUUID();
  const comment = {
    id: commentId,
    articleId,
    name,
    content,
    createdAt: new Date().toISOString(),
  };

  await kv.set(["comments", articleId, commentId], comment);

  return c.json({ success: true, comment });
});

// Zenn/Qiita Webhook同期エントリポイント
app.post("/api/sync", (c) => {
  return c.json({ success: true, message: "Sync triggered" });
});

// フロントエンドの静的アセットサーブ
// `/api/*` 以外のすべてのリクエストに対して、ビルド成果物を返す
app.use("/*", serveStatic({ root: "./packages/web/dist" }));

// SPAフォールバック
// 下記を追加しておくと、Svelte側でページ遷移（ルーティング）したURLに直接アクセスしたり
// ブラウザをリロードした際に404エラーになるのを防ぐ
app.get("*", serveStatic({ path: "./packages/web/dist/index.html" }));

Deno.serve({ port: 8000 }, app.fetch);
