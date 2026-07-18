# Catalog・Article・Works UI Refinement ExecPlan

Status: Implemented; Home WebGL budget exception remains

## Goal and non-goals

Motion glyph、catalog操作、固定Header、Articleの閲覧体験、Work詳細、外部link previewを、
スクロール・progressive enhancement・prerender境界を保ったまま一貫した編集UIへ更新する。 content
ID、reaction API、status enum、公開query、SSR/prerender境界は変更しない。

## Decisions and constraints

- Article本文開始時のDesktop HeaderはTheme、Display、hamburgerへ変形し、上へ戻ると復元する。
- status値は維持し、公開labelだけを公開済み、更新中、断片、旧版へ日本語化する。
- Link previewは明示refresh commandでGit管理cacheとlocal imageを更新する。通常buildはnetworkを
  使用しない。
- Workの外部actionはfrontmatterに実URLがある場合だけ表示し、仮URLを生成しない。
- Full motionだけがloopや大きな補間を使い、Reduced/Off、forced colors、save-dataは即時または
  静的表現へ縮退する。
- 既存のstaged/unstaged変更、Talk route削除、config、画像assetをuser-ownedとして保持する。

## Milestones

- [x] Motion glyph、catalog no-scroll、reset、共通content frame
- [x] Article本文でのDesktop Header compact化
- [x] Article preview、本文typography、copy、Mermaid、TOC、noise
- [x] Link preview registry、refresh command、offline validation
- [x] Work detail、status label、関連記事・更新履歴・Home indicator
- [x] 重複整理とarchitecture/design/content文書同期
- [ ] Unit、content validation、check、targeted E2E、Storybook、format、lint、design、build、budget

## Validation

- `deno task --cwd apps/web check`: pass、0 errors / 0 warnings。
- `deno task test:unit`: pass、4 files / 14 tests。
- `deno task content:validate`: pass、18 entries。
- `deno task links:refresh`: pass、Deno docs metadataとlocal WebPを更新。
- Targeted Playwright:
  - Grid/List、固定Header非交差、Article compact Header、Article/Mermaid/copy、Work detail、 200%
    text: pass。
  - Catalog scroll/resetとDesktop/Mobile TOC: pass（Desktop 2、Mobile 1、1 skip）。
- Full Playwrightを引数転送誤りにより1回実行し、今回対象の初期問題を検出して修正した。最終対象
  E2Eはpass。別scopeのHome profile drag timeoutとuser-owned Talk redirect削除による404は残存。
- `deno task lint`: pass、130 files。
- `deno task fmt:check`: pass、161 files。
- `deno task design:check`: pass。
- `deno task build`: pass。adapter-autoのdeployment adapter未選択warningのみ。
- `deno task storybook:check`: initial baseline差を検出。意図したUI変更として
  `UPDATE_VISUAL_BASELINES=true deno run -A scripts/check-storybook.ts`を実行し、61 stories、axe、
  responsive、editorial、motion、WebGL fallbackがpass。実行環境にWebGL2がなくcontext-loss
  checkのみskip。
- `deno task budget:check`: Article initial JavaScriptは92.1 KiB gzipで150 KiB上限内。 user-owned
  Weather/Hero shader変更を含むHome WebGL graphが250.3 KiB gzipとなり、230 KiB上限を 20.3
  KiB超過してfailure。上限は変更していない。

## Progress and discoveries

- Catalog filterはanchor navigation、Articles検索はGET、Works/Archive検索はclient-side
  `history.pushState`であり、SvelteKit
  navigationにno-scroll指定を加えれば公開URLを変えず保持できる。
- 現在のMobile TOCはnative detailsのopen方向だけが実質的に補間され、close時は即時非表示になる。
- Mermaidは初回renderでsource nodeを置換するため、theme変更後に再描画できない。
- Work schemaは`links.github`と`links.site`を既に持つが、現contentで実値があるのはQuiet Archiveの
  GitHubだけである。
- LinkCard metadataの自動取得はAccepted architectureの手動metadata方針を変更するため、通常buildと
  network refreshを分離した文書更新を実装と別に記録する。
- Icon-only storyを本文文字列で判定していたStorybook checkを、Story rootの描画要素判定へ修正した。
- StorybookはWebと同じauthored static assetを利用するため、`apps/web/static`をstatic directoryとして
  明示した。
- Filter後に結果が短くなってもscroll位置をclampしないよう、3 catalog routeは共通の最小document
  heightを持つ。enhanced navigation後は`afterNavigate`で同一pathname query変更時の位置を復元する。
- Mobile TOCはhydration前にnative details、enhancement準備後にBits UI Collapsibleを表示する。
