# アーキテクチャ

Status: Accepted

## 決定

このシステムはSvelteKitを唯一のデプロイ単位とするモジュラーモノリスです。公開コンテンツはGit管理の`.svx`、閲覧者由来のリアクションとそのレート制限だけはDeno
KVを正本にします。天候は20分キャッシュ可能な環境情報であり、永続データではありません。

```mermaid
flowchart LR
  Source[packages/content .svx] --> Validate[Zod + link validator]
  Validate --> Registry[build registry + search index]
  Registry --> Pages[SvelteKit prerendered pages]
  Registry --> Articles[SSR Articles GET search]
  Browser --> Pages
  Browser --> API[/api/v1 Hono]
  API --> OpenMeteo[Open-Meteo]
  API --> KV[(Deno KV)]
  Pages --> Feeds[RSS / Atom / Sitemap / OGP]
```

Honoは別サーバーではありません。SvelteKitのcatch-all
endpointがWeb標準`Request`をHonoへ渡し、レスポンスをそのまま返します。これによりorigin、Cookie、デプロイ、ログの境界が一つになります。

## パッケージの責務

| パッケージ | 責務                                      | 依存してよいもの            |
| ---------- | ----------------------------------------- | --------------------------- |
| `schemas`  | 公開型、frontmatter/API入力検証           | Zodのみ                     |
| `core`     | 検索・関連・変換・トグルの純粋関数        | `schemas`                   |
| `content`  | `.svx` registry、本文索引、ビルド検証     | `schemas`, `core`           |
| `api`      | HTTP境界、外部通信、Cookie、repository    | `schemas`, `core`, `config` |
| `ui`       | 共有表示部品、design tokens、著作素材slot | `schemas`, `config`         |
| `config`   | 公開可能なサイト設定                      | なし                        |
| `web`      | ルート、SEO、composition                  | すべての公開package         |

`core`はDOM、KV、fetchへ依存しません。`api`のリアクション保存はinterface越しにし、Deno
KVとメモリ実装を同じ契約で検証します。

## レンダリング境界

- Works、Archive、詳細、タグ、RSS/Atom、Sitemap、OGPはプリレンダリングする。
- `/articles`だけは任意のGET検索・category・代表tag・sortをJavaScriptなしで処理するため
  SSRとする。公開情報だけを返し、full queryをcache keyとして
  `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`で共有cacheできる。絞り込みURLは
  `noindex,follow`、canonicalは常に`/articles`とする。
- ArticlesとWorksは`view=grid|list`を公開queryとして受け取る。表示状態はURLだけを正本とし、
  localStorageへ保存しない。`view`だけが変わる同一pathname navigationはFull motion時に item-level
  View Transitionで配置を補間するが、URL更新とserver/client filterのdata flowは変更
  しない。Reduced/Off、JavaScript無効、未対応browserでは即時切替する。Listのhover mediaは既存
  coverだけを任意表示し、情報アクセスには使用しない。WorksとArchiveのclient filterは初期HTMLの
  全件表示を保つ。
- `/search`は検索語を維持して`/articles`へ恒久redirectする。旧Aboutと旧Archive一覧は migration
  manifestに基づく1 hopの308互換redirectだけを提供する。削除済みのTalk一覧・詳細・ OGP
  routeは互換redirectを提供せず404とする。互換redirectはHTTP 308を保持するためprerenderせず、
  本文・新OGPなどcanonical resourceのprerender境界とは分離する。
- `/api/v1`はアプリケーションの動的HTTP境界であり続ける。SSR Articlesと互換redirectは content
  delivery境界であり、別serviceや永続stateを追加しない。
- Mermaidは該当DOMがある記事でだけ遅延importする。
- SVXのGFM、heading、Shiki、Mermaid source、KaTeX変換設定はUI packageの共通build設定を
  WebとStorybookが利用する。KaTeXはbuild時にHTML化し、client runtimeを追加しない。
- Three.jsのHome rendererは`motion=full`かつ端末条件を満たした場合だけidle時にimportする。描画層は
  点群と天候を1つのrenderer/schedulerへ直接集約し、wrapper runtimeをWebGL
  graphへ含めない。記事routeは Heroを参照せず、天候はThree.jsを含まない軽量CSS背景へ縮退する。
- Homeは上部の100svh Heroと、最小100svhから内容量に応じて伸びるAboutをまたぐfull-bleedの単一visual
  layerだけを持つ。同じCanvas内で背景天候環境と中央Heroの責務・geometryを分け、rendererとanimation
  schedulerだけを共有する。WebGLはscroll位置を読まず、
  morph、位置、scale、pauseをscrollへ結び付けない。中央Heroのdrag/touchは観察角度だけを変更し、 fine
  pointerの近傍では点群が局所的に反発してpointer離脱後に原形へ戻る。Aboutのprofile cardは同
  sectionのpadding boxを論理境界とする任意の装飾操作とし、Fullのrelease時だけ短いrubber-band
  overshootを許可してdamped springで境界内へ戻す。慣性は保存せず、Reduced/Offでは無効にする。
  どちらもlink、text selection、native touch scrollを妨げず、情報アクセスに必須としない。
- Homeの2区間はroot scrollのmandatory snapを使う。小さなwheel/trackpad入力だけはHome限定controllerが
  36pxまで方向別に累積し、一度に隣接する1区間だけへ移動する。nested scrollを優先し、移動中は短時間
  lockして追加入力の振動を防ぐ。keyboardとtouchはbrowser標準のroot scrollへ委ねる。
- route間のView Transitionは`main`だけを対象とし、先に旧mainのexitを完了してから新mainを表示する。
  固定Header、Theme、Display、環境背景などroute間で継続するchromeは移動させない。Catalogの
  Grid/List切替だけは従来どおりitem-level transitionを使う。
- 天候は`config.defaultLocation`の固定地点だけをclientから取得し、地点名、文章、気温、設定UIを表示しない。
  `fog`は`cloudy`、`storm`は`rain`、取得fallbackは`neutral`な環境表現へ正規化する。
- ロゴ、人物、植物などの著作素材は`config.visualAssets`から`MediaSlot`へ渡す。空slotは構造だけを示し、有機的な図像をコード生成しない。
- 記事内LinkCardは`href`を安定keyとして、明示実行する`deno task links:refresh`だけが外部ページの
  title、description、site、OGP画像を取得する。生成metadataはGit管理JSON、画像は repository-local
  WebPを正本とする。通常のvalidation、build、prerenderはcacheだけを読み、 runtime
  proxy、外部画像hotlink、暗黙のnetwork fetchは導入しない。refreshはHTTP(S)に限定し、
  private/loopback address、redirect先、timeout、content type、HTML/image sizeを検証し、失敗時は
  既存cacheを破壊しない。

ビルド後のbudget checkは記事詳細の初期JavaScript依存を再帰集計し、gzip 150
KiBを超えたら失敗します。MermaidとWebGLのdynamic importはこの集計へ入りません。Home限定の 再帰WebGL
graphはgzip 230 KiBを上限とします。

Articles SSRを戻す場合はquery parserを残したまま一覧をprerenderへ戻し、`/search`のGET実装を
復元します。互換routeは独立して戻せます。Talk reactionはaliasで旧KV keyを使い続けるため、 content
routeのrollbackでKV data migrationは発生しません。Home WebGLはdynamic scene/controllerを
外すだけで静的geometryとHTML contentへ戻せます。

## コンテンツと検索

ディレクトリと`type:slug`が安定IDです。意図的なmigrationだけは一意な`legacyIds`と
`legacyPaths`で旧識別子を保持します。Zodのdiscriminated unionがArticle、Work、Diary、
Photo、Place、Wine、Momentを検証し、Talkはevent情報を持つArticle categoryとして扱います。
validatorはcanonical/legacy ID重複、slug/ディレクトリ不一致、関連ID、内部リンク、coverの存在、
外部画像hotlink、LinkCard URLに対応するlocal preview cacheも検査します。

検索文書はビルド時に本文をplain
text化して生成します。クエリは`Intl.Segmenter("ja")`の語と正規化後のbigramを併用し、タイトル8、タグ5、概要3、本文1の重みで順位付けします。

## リアクションとプライバシー

匿名actorはランダムUUIDとHMAC署名を持つ`Secure; HttpOnly; SameSite=Lax`
Cookieです。KVにはactorごとの選択、コンテンツ別集計、時間bucketの操作数だけを保存します。IP、User-Agent、位置情報、メールアドレスは保存しません。

PUTは同一origin、Zod入力、256 byte上限、actorあたり10分30操作で保護します。KV更新はversionstamp
checkを使ったatomic retryで集計と選択を同時に更新します。

## 障害時の縮退

- Open-Meteo失敗: config固定地点の現地時刻とday/nightだけを返し、画面はneutral背景を使う。
- WebGL未対応・低メモリ・save-data・Reduced/Off: Homeの中央motifは非表示にし、full-bleedの
  静的天候背景とHTML contentだけを残す。他routeは疎で低速なCSS天候背景を使う。
- Mermaid変換失敗: ソースを残し、表示失敗のaria-labelを付ける。
- リアクション失敗: 本文を妨げず、live regionにだけ通知する。
- JavaScript無効: 本文、主要ナビゲーション、Articles
  GET検索、フィードendpointは利用可能。WorksとArchiveの optional
  filterは無効になるが、全entryは読める。
