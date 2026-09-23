# UI基盤とWeb固有UIの再編

## 目的

利用者に見えるデザイン、操作、公開URL、SSR・prerender境界を維持したまま、`packages/ui`
を再利用可能なUI基盤へ絞り、サイト固有の実装を`apps/web`の機能別ディレクトリへ移す。
CSSの所有境界を明確にし、生成CSSのraw・gzipサイズとテーマ切り替え時の描画負荷を減らす。

## 対象外

- 新しい状態管理、plugin/controller/registry、dependency injectionの導入
- 公開URL、コンテンツschema、保存キー、API、デプロイ境界の変更
- 視覚デザインやテーマのクロスフェード、液体・天候表現の意図的な変更
- 新package、CSS Modules、CSS-in-JS、計測サービスの導入

## 制約

- `packages/ui`はtokens、基本CSS、primitives、icons、fonts、utilsだけを公開する。
- Web固有コードは具体的なファイルからimportし、Web側にbarrelを追加しない。
- Svelteコンポーネントに`<style>`を追加せず、Tailwind CSS 4とsemantic tokenを使う。
- 記事拡張、WebGL、Mermaidの遅延読み込みと停止条件、no-JSでの主要操作を維持する。
- 現在の未コミット変更を保持し、`.devcontainer/Dockerfile`へ触れない。

## 移行表

| 現在                          | 移行先                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `packages/ui/src/components`  | `apps/web/src/lib/articles`、`home`、`shell`、`preferences`、`PageHead.svelte` |
| `packages/ui/src/patterns`    | `apps/web/src/lib/articles`、`home`                                            |
| `packages/ui/src/motion`      | `apps/web/src/lib/home`、`navigation`、`preferences`、`visuals`                |
| `packages/ui/src/visuals`     | `apps/web/src/lib/articles`、`home`、`visuals`                                 |
| `packages/ui/src/foundations` | `packages/ui/src/styles`と`apps/web/src/styles`                                |
| UI内のStory・preview・fixture | `apps/web/stories/{ui,articles,home,shell,visuals}`                            |
| UIのStorybook設定・検査       | `apps/web/.storybook`、`apps/web/scripts`                                      |
| UIのmdsvex設定・SVX型         | `apps/web/mdsvex.config.js`、`apps/web/src/svx.d.ts`                           |

## 実装手順と受け入れ条件

1. 実行時コンポーネントと補助モジュールを機能別に移し、全importを一括更新する。
   - `packages/ui/src`には計画したstyles/primitives/icons/fonts/utilsだけが残る。
   - `ContentDetailView`と`ResponsivePicture`の余分な階層を統合する。
2. UI packageのexportsを`primitives`、`icons`、`utils`、`fonts`、`styles.css`へ限定し、
   `$ui`と`@lunacea/ui/*`の深いaliasを削除する。
   - repository内に旧importが残らず、WebのSvelte/type checkが通る。
3. Tailwind入口をWebの`styles/app.css`へ一本化し、共通CSSとWeb固有CSSを分割・簡素化する。
   - 未使用reveal/keyframe/utilityと重複motion規則がない。
   - theme/route transition、print、forced colors、生成記事DOMが維持される。
4. StorybookとfixtureをWebへ移し、UI基盤とWeb featureを機能別storyで表示する。
   - Storybook buildと既存のaxe・overflow・200%文字拡大検査が通る。
5. architecture、design-system、content-authoring、該当AGENTS/READMEを現行境界とimport例へ更新する。
6. 関連チェック、production build、budget、対象E2Eを実行し、CSSサイズと遅延chunkを確認する。
   - 生成CSSが基準の`144,796 bytes / 29,824 bytes gzip`をraw・gzipとも下回る。
   - 記事初期経路にThree.jsとMermaidが入らない。

## 進捗

- [x] 現行構造、利用箇所、既知のdesign/budget違反を調査した。
- [x] 実行時コードを移動しimportを更新する。
- [x] UI公開境界とCSSを再編する。
- [x] Storybook、mdsvex、fixtureをWebへ移す。
- [x] 文書と継続制約を更新する。
- [x] 検証とサイズ比較を完了する。

## 判断と発見

- `ContentDetailView`は単一利用のため`ContentDetail.svelte`へ統合する。
- `ResponsivePicture`はWebの`ResponsiveImage.svelte`へ統合する。
- `ReadingEnhancements`と`block-tools.ts`は既存の2単位を維持する。
- `HomeSnapController.svelte`は参照がなく、移行せず削除する。
- reveal用data属性を状態へ変換する実装が存在しないため、対応selectorとkeyframeは削除対象とする。
- `WeatherField.svelte`はroot layoutで一度だけmountし、route遷移をまたいで同じ天候の場を保つ。
  `EditorialLight`のThree.jsは条件成立後のdynamic importに留め、記事初期graphへ含めない。
- route遷移ではrootと天候背景をsnapshotに含めず、page内容をlive DOMでfade inする。headerと記事紙面
  だけをView Transition対象にし、天候背景の描画ループを止めない。テーマ切り替えはroot
  snapshotを使う。
- StorybookのSvelteKit統合には公式の`@storybook/sveltekit`を開発依存として使う。WebがStorybookを
  所有し、UIとWeb固有featureの両方を同じpreviewで検査するためである。
- Tailwindは`source(none)`と明示した`apps/web/src`、`packages/ui/src`、公開`.svx`だけを本番scanする。
  `stories`はStorybook previewだけがscanし、unit testとfixtureは`apps/web/tests`へ置く。
- Mermaid生成SVGは独自のlayout timingを持つ。表示設定による停止規則とMermaid固有の除外はWebの
  `app.css`が所有し、UIの`base.css`にはMermaidの知識を持たせない。

## 検証記録

- `deno task fmt:check`、`deno task lint`、`deno task design:check`: 成功。
- `deno task test`: Deno 21件、Vitest 26件が成功。testとfixtureを`apps/web/tests`へ移した後にも
  `deno task --cwd apps/web test:unit`で26件の成功を確認した。
- `deno task --cwd apps/web check`: Svelte/TypeScriptのerror、warningともに0件。
- `deno task fonts:check`: preload 167.2 KiB、全route subset 305.7 KiBで成功。Archivo、Zen Kaku
  Gothic New、Fira Codeの各sourceは実利用中で、未使用source fontはなかった。
- `deno task content:validate`: 10件のcontentを検証した。
- `deno task storybook:check`: 64 Storyのbuild、axe、320/768/1280/1600px、200%文字拡大、
  editorial、motion、WebGL失敗時の静的fallbackを検証した。
- `E2E_PREVIEW=1 deno task test:e2e`: 29件成功。ローカルChromiumがWebGL contextを作れないため、
  capabilityを必要とするdesktop/mobileの2件はskipした。WebGL失敗時fallback、no-JS、keyboard、 forced
  colors、reduced motionと今回の4修正は成功した。
- production buildと`deno task budget:check`: 成功。記事初期JavaScriptは118.0 KiB gzip / 23 files、
  天候背景の動的WebGL graphは129.8 KiB gzip / 2
  files。Three.jsとMermaidは記事初期graphに含まれない。
- 生成CSSは`140,258 bytes / 28,992 bytes gzip`。基準の`144,796 / 29,824`からrawを4,538 bytes、
  gzipを832 bytes削減した。
- 追加修正後にSvelte check、design check、motion同期のcomponent test、ヘッダ・背景遷移とdesktop
  TOCの対象E2Eが成功した。遷移中の天候背景へ160 ms周期の描画を当てた6フレームでは、45 msごとに
  画素値が変化し、背景がlive DOMとして描画され続けることを確認した。ヘッダのbackdrop
  blur残留もない。

作業開始時のGit状態と現在実装を同じheadless Chromiumで各1回計測した。navigation後2.5秒までの
style再計算とlayoutの累積は、Home 61.4→61.5 ms、記事一覧 19.5→40.1 ms、記事詳細 137.0→115.2
ms、テーマ切り替え85.7→35.6 msだった。一覧は累積が20.6 ms増えたが50 ms以上の long taskはなく、全3
routeで安定後1.5秒のstyle再計算とlayoutはともに0回だった。計測中の最大long taskは旧実装95 ms、現在74
msで、常時style/layout更新は確認されなかった。

## 移行とロールバック

旧importの互換層は作らず、利用箇所を同じ変更で更新する。移行中は段階ごとに参照検索と
型チェックを行う。問題時はこの変更一式をGitでrevertすれば旧配置へ戻せる。公開URL、schema、
保存データを変更しないため、データ移行や別のrollback手順は不要。

## リスク

- CSSのimport順やTailwind scan範囲変更により、生成classやcascadeが変わる可能性がある。
- Storyを本番source外へ移すことで、Story専用classを明示的にscanさせる必要がある。
- root layoutから視覚効果を移す場合、対象ページと遅延読み込みの一致をE2Eで確認する必要がある。
- ローカルのheadless ChromiumではWebGL contextを作れず、実canvasの描画とcontext lossの2経路は
  capability skipになった。失敗時fallbackと遅延chunk境界は検証済みだが、GPUを利用できる環境での
  最終確認は残る。
- Performance値は各経路1回の参考値であり、専用benchmarkや統計的な反復計測ではない。
