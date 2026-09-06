# ブログ／ポートフォリオ Layout Redesign ExecPlan

Status: Implemented locally; final visual and real-device approval pending

## Goal

既存の情報設計、Articles SSR、Works/Archive prerender、画像処理、Home限定WebGL境界を
維持しながら、英数字と日本語の混植、罫線の少ない編集的レイアウト、非固定Header、Homeの
200svh構成、一覧の検索・表示切替、穏やかな遷移を実装する。WebGL typographyは別計画に残す。

## Fixed decisions

- DesktopはArticles、Works、Archiveの常設navigationを維持する。
- ArticlesとWorksの表示状態は`view=grid|list`だけで共有し、localStorageへ保存しない。
- Homeのscroll snapは`proximity`とし、wheel/touchを横取りしない。
- Home 3Dはscrollから完全に独立させ、drag/touchだけを任意の観察操作として残す。
- Footerを削除し、GitHub/X/EmailはHomeのprofile card、RSS/Atom/SitemapはHeader menuへ移す。
- profile assetがない間は`profile-creature-crescent-v1`（1:1、透過必須）のplaceholderを使う。
- 未指定のsocial URLと代表filterは`null`/空配列を正式な状態とし、値を推測しない。

## Public contracts

- `/articles?q=&category=&tag=&sort=&view=list|grid`
- `/works?q=&field=&technology=&status=&year=&view=grid|list`
- `/archive?q=&kind=&tag=&year=`
- Workは`fields: string[]`を持ち、既存`stack`をtechnologyの正本とする。旧`stack` queryは
  読み込み時だけaliasとして受理し、生成URLは`technology`へ正規化する。
- `siteConfig.catalogFilters`はArticles、Works、Archiveの手動代表値を所有する。空groupは
  表示しない。ただしArchive kindはschema順の5種類を表示できる。
- Articlesの既定表示はList、Worksの既定表示はGrid。JavaScriptなしでも同じ既定表示を読む。
- `/about`と`/search`は既存の1 hop 308互換routeを維持し、旧URLをSitemapへ含めない。

## Layout and motion

- Headerは通常flowで、desktopはWeather / primary nav / Display / Menu、mobileはWeather / Display /
  Menuとする。About/Searchはmenuへ置かない。
- Homeは上部と下部が各`min-height: 100svh`の200svh continuum。単一visual layerを全体へ
  配置し、下部`#about`には1枚だけglass profile cardを置く。
- Page enterは520ms/6px、exitは280ms/opacityのみ。shared transitionは対応するcoverだけ。
- revealは520ms/8px、media revealは760ms、menu/disclosureは240ms/4px。
- Home 3Dはhold 3.2s、separate .6s、recompose 1.6s。scroll listenerは持たない。
- reduced/off、forced-colors、save-dataでは非本質motionを停止し、static fallbackを保つ。

## Baseline

開始時点は`feat/post-articles` / `d715346`、clean worktree。

| Check                       | Baseline                                      |
| --------------------------- | --------------------------------------------- |
| `deno task check`           | pass、18 content、Svelte diagnostics 0        |
| `deno task test`            | pass、Deno 20 / Vitest 9                      |
| `deno task fonts:check`     | pass、preload 261.3 KiB / route 451.1 KiB     |
| `deno task build`           | pass、500 KiB chunk/adapter-auto warning      |
| `deno task budget:check`    | Article 106.5 KiB / Home WebGL 211.1 KiB gzip |
| `deno task storybook:check` | pass、42 stories                              |
| `deno task preview:audit`   | pass、CLS 0.0029                              |
| `deno task test:e2e`        | 15 pass / 38 skip / 7 fail                    |

E2Eの6件は並列初回変換時のtimeoutで単独成功した。mobile touch hit-testだけは再現する
既存不具合で、T11/T13で修正する。StorybookのWebGL context-lossは実行browserにWebGL2がなく
skipされた。

## Progress

- [x] T01 Baseline、ExecPlan、architecture/design/content契約
- [x] T02 Typography specimenとfont選定
- [x] T03 Border、Footer、不要ラベル整理
- [x] T04 Header再設計
- [x] T05 About/Search URLとnavigation migration
- [x] T06 Page transition基盤修正
- [x] T07 Home 200svh静的構造
- [x] T08 Scroll SnapとHome smooth anchor
- [x] T09 Home内Aboutとglass profile card
- [x] T10 Profile asset placeholder契約
- [x] T11 3D visual layer再配置
- [x] T12 点群可読性改善
- [x] T13 Scroll削除とDrag/Touch調整
- [x] T14 Articles filterとSearch
- [x] T15 Works filter
- [x] T16 Archive filter
- [x] T17 Articles Grid/List
- [x] T18 Works Grid/List
- [x] T19 Works interactionとimage presentation
- [x] T20 Storybookとvisual regression基盤
- [x] T21 Accessibility監査
- [x] T22 Performance/bundle監査
- [x] T23 Redirect/SEO/Sitemap/OGP回帰
- [ ] T24 Production buildと最終レビュー（自動検証済み。実機・screen reader・公開前visual承認待ち）

各Txxはユーザー提示の受け入れ条件、自動/手動/visual/a11y/performance確認、rollbackを
満たしてから完了にする。architecture/design/content文書の変更とproduction実装はdiff上で
判別できる状態を維持する。

## Validation gates

最終的に`fmt:check`、`lint`、`design:check`、`check`、`test`、`content:validate`、
`fonts:check`、`storybook:check`、`build`、`budget:check`、`test:e2e`、`preview:audit`を実行する。
Article 150 KiB、Home WebGL 230 KiB、font preload 350 KiB、route font 500 KiBを緩和しない。

## Implementation results

| Check                        | Final result                                                          |
| ---------------------------- | --------------------------------------------------------------------- |
| `deno task fmt:check`        | pass、152 files                                                       |
| `deno task lint`             | pass、123 files                                                       |
| `deno task design:check`     | pass                                                                  |
| `deno task check`            | pass、18 content、Svelte diagnostics 0                                |
| `deno task test`             | pass、Deno 21 / Vitest 9                                              |
| `deno task content:validate` | pass、18 entries（`check`内でも実行）                                 |
| `deno task fonts:check`      | pass、preload 165.6 KiB / route 443.0 KiB                             |
| `deno task storybook:check`  | pass、51 stories、axe/responsive/200%/visual baseline/motion/fallback |
| `deno task build`            | pass                                                                  |
| `deno task budget:check`     | pass、Article 108.0 KiB / Home WebGL 210.9 KiB gzip                   |
| `deno task test:e2e`         | pass、22 passed / 38 skipped、2 workers                               |
| `deno task preview:audit`    | pass、CLS 0.0008 / same-origin fonts 6 requests                       |

既存の500 KiB超chunk警告とadapter-auto環境警告は継続する。StorybookのWebGL
context-loss検査は実行browserがWebGL2を提供しないためskipされ、save-data/low capability/no
WebGL2のfallback検査は成功した。新規の型・lint・axe・budget警告はない。

未完のmanual確認は、実iOS/AndroidでのScroll Snapとtouch drag、実screen readerのlandmark/focus
読み上げ、production previewのvisual承認、profile実assetと公開social/filter値の提供である。 Local
Chromiumでは1440×900のHome/About/Articles Grid/Works GridとPixel 7相当のHomeを目視し、
非固定Header、200svh境界、placeholder、catalogの情報順序にblockingな崩れがないことを確認した。

## Decisions and discoveries

- Manrope/Zenを本文・UI、Newsreader/Hinaを大見出し・引用、Fira Codeをcode/kbd/technical
  identifierだけへ使う初期方針。production適用前に混植Storyで比較する。
- Worksのfield初期値は既存内容から移行するが、代表filterは空のままにする。
- Footerのsample statusは既存SampleBannerが担う。RSS/Atom/SitemapはHeader utilityへ移す。
- profileのFieldは暫定的に`Interactive Systems / Visualization / Accessible Information
  Design`を使い、公開copyとして後から差し替え可能にする。
- Scroll Snapに先頭originがない場合、Chromiumが初回表示でIntroへ整列し、非固定Headerを
  viewport外へ送る。SampleBannerまたはHeaderを先頭snap areaにして回避する。
- E2Eは主要routeをglobal setupでwarm-upし、local/CIとも2 workersに揃えることで初回Vite変換と
  hydrationの競合を解消した。timeout値は変更していない。

## Rollback

Fontはgenerated import/preloadを外して現行faceへ戻せる。Header/Footerはcomposition単位、Homeは
static layout、snap、glass、WebGL scene/controllerを個別に戻せる。Catalogはquery parserを残して
既定表示へ固定できる。互換redirectは独立して戻せる。Content ID、Reaction KV、storage migrationは
変更しないためdata rollbackは不要。
