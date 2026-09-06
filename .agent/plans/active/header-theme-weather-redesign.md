# Header・テーマ・天気表現の再設計 ExecPlan

Status: Implemented locally

## Goal and non-goals

全ページ共通Headerを透明な固定操作レイヤーへ変更し、ThemeをDisplayから分離する。画面上の
天気・地点・SAMPLE表示を削除し、固定地点の天気はHome専用WebGL環境とHome以外の軽量背景へ
反映する。RSS、Atom、Sitemap endpointは維持するがNavigationには表示せず、RSSのArticles導線は
別作業とする。

## Constraints and decisions

- DesktopはArticles、Works、Archiveの縦NavigationとTheme、Displayだけを右上に置く。
- MobileはTheme、Display、Hamburgerの順とし、menuには3つのprimary routeだけを置く。
- `lunacea-theme=auto`は初回操作までOS追従し、その後はlight/darkを明示保存する。
- Weather conditionは`clear | cloudy | rain | snow | neutral`へ正規化する。
- Homeの天気と中央3Dは責務を分け、同じThrelte Canvasとrendererを共有する。
- Home以外へThrelte、Three.js、中央Heroの依存を入れない。既存230 KiB WebGL budgetを維持する。
- `sampleMode`とnoindex/feed除外は維持し、画面上のSAMPLE表示だけを削除する。

## Milestones

- [x] Header、Theme toggle、motion-only Display、Home title glyph、SAMPLE削除
- [x] 固定地点weather controller、normalizer、軽量route fallback
- [x] Home weather environment、共通Canvas、fallbackとcleanup
- [x] Unit、Storybook、E2E、bundle境界検証
- [x] Accepted architecture/design docsと運用docsの同期

## Validation

- `deno task fmt:check`: pass、155 files。
- `deno task lint`: pass、126 files。
- `deno task design:check`: pass。
- `deno task check`: pass、18 content entries、Svelte 0 errors / 0 warnings。
- `deno task test`: pass、Deno 22 tests、Web unit 9 tests。
- `deno task content:validate`: pass、18 entries（`check`内でも再実行）。
- `deno task fonts:check`: pass、initial preload 164.7 KiB、all-route preload 440.7 KiB。
- `UPDATE_VISUAL_BASELINES=true deno task storybook:check`: pass、56 stories。baseline更新。
- `deno task storybook:check`: pass、56 stories、axe、responsive、visual、motion、fallback。
  実行browserがWebGL2を公開しないためcontext-loss injectionだけskipし、no-WebGL、save-data、
  low-capability fallbackはpass。
- `deno task build`: pass。adapter-autoのproduction environment未検出warningは既存構成由来。
- `deno task budget:check`: pass。Article initial 105.1 KiB gzip、Home WebGL 211.7 KiB gzip。
- `deno task test:e2e`: pass、24 passed / 42 project-condition skips。
- `PREVIEW_URL=http://127.0.0.1:4173 deno task preview:audit`: pass。CLS 0.0007、font、landmark、
  crawler metadata、1200x630 OGPを確認。単体の`deno task preview:audit`はpreview serverを起動しない
  taskのため、最初は4174へのconnection refusedになった後、定義済みpreviewを起動して再実行した。

## Progress and discoveries

- 開始時点のworktreeには進行中layout redesignを含む多数の未コミット変更がある。すべて
  ユーザー所有として保持し、今回対象へだけ差分を追加する。
- 既存Headerは通常flow、中央Desktop nav、全画面hamburger、WeatherWidget、Themeを含むDisplayで
  構成されている。既存Home WebGL graphは210.9 KiB gzipで、上限まで約19 KiBの余裕がある。
- Weather visualはAPIの文章・温度・地点をDOMへ出さず、固定config地点から得たconditionだけを
  request-scoped storeで共有する。Home以外はCSS、Homeは既存Canvas内の独立environmentとした。
- 最終manifestではArticle初期JS 105.1 KiB gzip、Home WebGL 211.7 KiB gzip。budget checkerは全
  non-Home nodeからHeroScene、Threlte、Three.jsへの到達も検査する。
- Desktop 1440x900、Mobile 412x915、Dark Homeをheadless browser screenshotで目視確認した。
  実機、screen reader、WebGL2 context-lossの手動確認は未実施。
