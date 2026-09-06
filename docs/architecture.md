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

`ui`は`LinkSelector`、semantic `Badge`、action variant、`CatalogControls`、
`ContentDetailView`、`ResponsivePicture`、controlled `ReactionControl`、`ShareActions`を所有します。
これらはroute
state、network、repository、SEOを読みません。`web`はSEO/JSON-LD、URLとquery、画像registry 解決、API
fetchとZod検証、Home固有controller、およびUIへデータを渡す薄いadapterだけを所有します。
WebとStorybookは同じ`packages/ui/src/foundations/global.css`を直接読み込み、アプリ固有の第二のglobal
themeを持ちません。

## レンダリング境界

- Article詳細、Home、RSS/Atom、Sitemap、OGPはプリレンダリングする。WorksとArchiveの一覧・詳細・互換ルートと対象コンテンツは廃止し、旧URLと対象OGPは404とする。
- `/articles`はGET検索をJavaScriptなしで処理するSSRを維持する。公開情報だけを返し、full queryをcache
  keyとする `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`
  を維持する。絞り込みURLは `noindex,follow`、canonicalは `/articles`。
- Articlesは `view=grid|list` をURLで管理する。初期状態と `grid` は新聞表示、`view=list`
  だけがlistである。category、tag、sort、検索語は表示形式を変更せず、絞り込みは新聞のままでも成立する。categoryは常時表示のstrip、検索はHeaderにあり、tagとsortと結果件数はlistが所有する。viewのみの変更はFull
  motion時にitem-level View Transitionを使用できる。
- 新聞の「本日のPick
  Up」は、front記事を除いた残りからUTC日付をseedとする決定的な抽選で選び、SSRとshared
  cacheで同じHTMLになる。抽選された記事は同じページの一覧から除き、記事の重複表示を作らない。絞り込み中とlistでは表示しない。
- インプレッションは記事単位の公開カウンタであり、Deno KVに `impression/count` と有効期限付きの
  `impression/seen`
  だけを保存する。IP、User-Agent、参照元、閲覧時刻は保存しない。記録は記事詳細からのsame-origin POST
  `/api/v1/impressions/:type/:slug` で、既存の匿名署名Cookieのactorとsessionごとに一度だけ行う。
  カタログ右のランキングはSSRでKVを読み、KVが読めない場合もカタログは完全に機能する。
- Header検索は全ルートで利用できるGETフォームであり、`q` と `view=list` を `/articles`
  へ送る。JavaScriptがない場合はHeader内の静的フォームが同じ役割を果たす。
- `/search`は検索条件と `view=list` を保持して `/articles`
  へ308転送する。旧Aboutの308転送は維持する。互換転送はprerenderせず、独立したHTTP応答とする。
- `/api/v1`はアプリケーションの動的HTTP境界であり続ける。SSR Articlesと互換redirectは content
  delivery境界であり、別serviceや永続stateを追加しない。
- Mermaidは該当DOMがある記事でだけ遅延importする。
- SVXのGFM、heading、Shiki、Mermaid source、KaTeX変換設定はUI packageの共通build設定を
  WebとStorybookが利用する。KaTeXはbuild時にHTML化し、client runtimeを追加しない。
- Three.jsのHome rendererは`motion=full`かつ端末条件を満たした場合だけdynamic importする。通常は
  idle時、tab内で最初のHome
  openingだけは導入開始時に読み込みを始めるが、表示完了を待たない。描画層は
  中央点群を単一renderer/schedulerへ集約し、wrapper runtimeをWebGL graphへ含めない。
  天候は初期SVGからWebGLへの二段階切替を廃止し、全route共通の固定軽量層で表示する（雨はCanvas
  2D、その他はSVG/CSS）。 雨は奥行き・風・露光による雨筋、雪は奥行きの異なる降雪を表現し、
  本文やnavigationへのpointer入力を透過する。 save-data、Reduced/Off、forced
  colors、低能力端末、WebGL失敗時は静的Homeへ縮退する。記事routeはThree.jsを参照せず、天候は軽量CSS背景へ縮退する。
- Homeは上部の100svh Heroと、最小100svhから内容量に応じて伸びるAboutをまたぐfull-bleedの単一visual
  layerを中央Hero用に持つ。天候層はlayoutに所有させ、opening・scroll・WebGLの読み込みから独立する。
  WebGLはscroll位置を読まず、
  morph、位置、scale、pauseをscrollへ結び付けない。中央Heroのdrag/touchは観察角度だけを変更し、 fine
  pointerの近傍では点群が局所的に反発してpointer離脱後に原形へ戻る。Aboutのprofile cardは同
  sectionのpadding boxを論理境界とする任意の装飾操作とし、Fullのrelease時だけ短いrubber-band
  overshootを許可してdamped springで境界内へ戻す。慣性は保存せず、Reduced/Offでは無効にする。
  どちらもlink、text selection、native touch scrollを妨げず、情報アクセスに必須としない。
- Homeの2区間はroot scrollのmandatory snapを使う。小さなwheel/trackpad入力だけはHome限定controllerが
  36pxまで方向別に累積し、一度に隣接する1区間だけへ移動する。nested scrollを優先し、移動中は短時間
  lockして追加入力の振動を防ぐ。keyboardとtouchはbrowser標準のroot scrollへ委ねる。
- Home専用openingはtab内の初回だけ約1.8秒で、loading mark、visual/点群、title、残りのHTMLを順に
  明らかにする。sessionStorageは再生済みflagだけを持つ。navigationとHTMLは最初から存在し、openingは
  pointerを遮らず、WebGL準備を待たない。Reduced/Off、save-data、forced colors、JavaScript無効では
  再生しない。
- 共通RevealはIntersectionObserverで一度だけ表示し、同時対象へ最大240msのstaggerを付ける。scroll
  parallaxはin-viewのmediaだけを単一requestAnimationFrameで最大16px動かし、本文とcontrolは動かさない。
  hidden tabと能力fallbackでは停止してCSS変数を除去する。
- route間のView Transitionは`main`だけを対象とし、先に旧mainのexitを完了してから新mainを表示する。
  固定Header、Theme、Display、環境背景などroute間で継続するchromeは移動させない。Catalogの
  Grid/List切替だけは従来どおりitem-level transitionを使う。一覧から詳細へのtitleとcoverはcontent
  ID単位のshared transitionを使用できる。Reduced/Offと履歴移動では即時切替する。
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
KiBを超えたら失敗します。MermaidとWebGLのdynamic importはこの集計へ入りません。Homeの再帰WebGL
graphはgzip 230 KiBを上限とします。

Articles SSRを戻す場合はquery parserを残したまま一覧をprerenderへ戻し、`/search`のGET実装を
復元します。互換routeは独立して戻せます。Home WebGLはdynamic scene/controllerを外すだけで
静的geometryとHTML contentへ戻せます。

## コンテンツと検索

ディレクトリと`type:slug`が安定IDです。意図的なmigrationだけは一意な`legacyIds`と
`legacyPaths`で旧識別子を保持します。Zodのdiscriminated unionがArticle、Work、Diary、
Photo、Place、Wine、Momentを検証し、Talkはevent情報を持つArticle categoryとして扱います。
validatorはcanonical/legacy ID重複、slug/ディレクトリ不一致、関連ID、内部リンク、coverの存在、
外部画像hotlink、LinkCard URLに対応するlocal preview cacheも検査します。

検索文書はビルド時に本文をplain
text化して生成します。クエリは`Intl.Segmenter("ja")`の語と正規化後のbigramを併用し、タイトル8、タグ5、概要3、本文1の重みで順位付けします。

ArticleのSVX
sourceはbuild時に文章、technical、mediaの出現順ブロックと正規化位置・量、本文文字数、H2/H3
IDを生成する。目次の構造表示は縦長コードマップ、一覧は読了1分ごとに増える最大5枚の紙として表す。本文文字列は複製しない。見出しとの対応はIDで結び付ける。

## リアクションとプライバシー

匿名actorはランダムUUIDとHMAC署名を持つ`Secure; HttpOnly; SameSite=Lax`
Cookieです。KVにはactorごとの選択、コンテンツ別集計、時間bucketの操作数だけを保存します。IP、User-Agent、位置情報、メールアドレスは保存しません。

PUTは同一origin、Zod入力、256 byte上限、actorあたり10分30操作で保護します。KV更新はversionstamp
checkを使ったatomic retryで集計と選択を同時に更新します。公開モデルは称賛を表す1種類だけで、
レスポンスは`count`とactor自身の`selected`を返します。PUTはGETと同じ
`/api/v1/reactions/:type/:slug`へ`active`を送ります。旧3種類のreaction keyは移行・参照せず、
単一称賛用の新しいKV keyを正本とします。

## 障害時の縮退

- Open-Meteo失敗: config固定地点の現地時刻とday/nightだけを返し、画面はneutral背景を使う。
- WebGL未対応・低メモリ・save-data・Reduced/Off: Homeの中央motifとopeningは非表示にし、full-bleedの
  静的天候背景とHTML contentだけを残す。他routeは疎で低速なCSS天候背景を使う。
- Mermaid変換失敗: ソースを残し、表示失敗のaria-labelを付ける。
- リアクション失敗: 本文を妨げず、live regionにだけ通知する。
- JavaScript無効: 本文、主要ナビゲーション、Articles
  GET検索、フィードendpointは利用可能。新聞とリストの切替、目次の通常リンクを利用できる。

Homeのプロフィールは紙の名刺、短い専門領域の紹介、Articlesへのリンクを持ち、区間のviewport中央に配置する。内容が収まらない画面では区間が伸びる。技術名一覧は掲載しない。
