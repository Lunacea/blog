# Interaction・Catalog・Editorial Refresh ExecPlan

Status: Implemented and validated

## Goal and non-goals

Theme切替でHome WebGLのweatherと点群timelineを壊さず、点群の表面密度と天候表現を改善する。
Header操作、Articles/Works/Archive一覧、記事本文、Works詳細を、ユーザー提示の参照画面に沿った
コンパクトで画像主導の表現へ更新する。公開ID、content schema、reaction storage、rendering境界は
変更しない。

## Decisions and constraints

- Theme変更はmotion preferenceを再適用せず、既存Canvas、geometry、schedulerを保持したまま shader
  uniformだけを更新する。
- Displayは単一のicon buttonとし、Full → Reduced → Offを循環する。現在値と次の操作はaccessible
  nameで伝え、冗長な`Motion`文言と展開panelを削除する。
- Homeをprimary navigationへ追加し、active stateはunderlineではなく矩形の塗りで示す。
- Liquid glassはmenu、filter、mobile TOC、hover previewなど一時的なinteractive surfaceに限定する。
  本文面とHeader全体には常設しない。
- Articles/WorksのListは罫線付きcompact rowとし、fine pointerのhover/focus時だけ既存coverを背景へ
  大きく表示する。coverがないArticleは色面だけで成立させる。
- LinkCardのOGPはremote hotlinkやruntime fetchを使わず、任意のlocal image propで表示する。
- Existing Article 150 KiB / Home WebGL 230 KiB gzip budgetとprerender/SSR境界を維持する。

## Milestones

- [x] Theme/motion event分離、uniform palette同期、WebGL timeline回帰テスト
- [x] 点群sampling/sprite密度とclear/cloudy/rain/snow shader表現
- [x] Header、Display、Home navigation、active fill、hamburger alignment、cursor中心点
- [x] 共通compact filter disclosure、件数、icon view toggle、catalog header簡略化
- [x] List hover mediaとWorks image-first grid/detail
- [x] Editorial rhythm、dark code、local OGP card、animated mobile TOC、compact reactions
- [x] Accepted design/architecture documentation同期
- [x] Targeted tests、check、build/budget、最小限のvisual/E2E確認

## Validation

- `deno task --cwd apps/web check`: pass（Svelte 0 errors / 0 warnings）。
- `deno task test`: Deno 23件はpass。Web unitは新しい件数表示に対する旧assertion 1件がfailしたため、
  assertionを更新した。
- `deno task test:unit`: pass（3 files / 11 tests）。
- `deno task fmt:check`: pass（156 files）。
- `deno task lint`: pass（127 files）。
- `deno task design:check`: 初回はraw gap/z-index 3件を検出。tokenへ置換後にpass。
- `deno task build`: 初回は既存configの誤ったprofile image URLでprerenderがfail。実在する
  `/images/Lunacea-nobg.png`へ修正後にpass。
- `deno task budget:check`: pass。Article initial 109.9 KiB gzip、Home WebGL 225.0 KiB gzip。
- Targeted Playwright desktop: pass（theme/motion、header、article reading tools、keyboardの4件）。
- Targeted Playwright mobile: pass（menu Escape/focusの1件）。
- Desktop/mobileのcatalog、light/dark theme、WebGL継続、list hover、記事詳細をブラウザで確認した。

## Progress and discoveries

- 開始時点のworktreeには`packages/config/mod.ts`と
  `apps/web/static/images/Lunacea-nobg.png`のユーザー変更があり、上書きしない。
- Theme切替後も`data-motion="full"`とCanvasは残るが、1秒間のvisual差分が大幅に減少する。
  `HeroObject`と`WeatherEnvironment`がpalette prop変更時にmaterial/uniform objectを再構成し、
  `useTask`が更新する参照と表示materialが分離する構造が原因。
- 参照Listは通常時に余白の少ない4列rowを表示し、hover時に選択画像を複数行の背面へ露出する。
  Works参照は大きなimage比率と短いtitle/category/dateを優先する。
- Theme切替後のCanvas frame差分はmean 1.08056、changed ratio 0.02604で、timeline継続を確認した。
  paletteのtheme差分はmean 193.3297、changed ratio 0.99978となり、点群色の更新も確認した。
- Surface samplingはMöbius band数を14から20へ増やし、sphere点を内側へ縮退させていた処理を削除した。
  particle budget自体はlow 1400 / high 3200のまま維持した。
- Weatherは既存Canvas内のshader enhancementとして、clearの斜光、cloudyの多層fog、rainの
  droplet/stream、snowの多層flakeを実装した。optional visual failure時の本文・navigation fallbackは
  変更していない。
