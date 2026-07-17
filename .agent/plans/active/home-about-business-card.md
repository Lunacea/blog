# Home Hero / About再構成 ExecPlan

Status: Complete

## Goal and scope

Homeだけを対象に、Theme motif、About profile card、Introduction、Engineering、2区間snap、 Minimal
fallback、full-bleed visual layerを一つの構成として整える。Articles、Works、Archive
など他routeのlayout、中央Heroのgeometry/morph、天候data境界は変更しない。

## Interaction contract

- 旧React実装は参照せず、現行Svelte Heroのpointer intent、capture、cleanup方針だけを再利用する。
- profile imageまたはカード余白から開始した操作だけをdrag候補にし、linkと選択可能なtextは除外する。
- coarse pointerでは横方向の意図を確認してからcaptureし、縦gestureはnative scrollへ渡す。
- offsetはAbout sectionのpadding boxへclampし、resize後にも補正する。位置は永続化しない。
- Full motionでは短いdamped inertiaを許可し、About境界で停止する。Reduced/Offではinertiaとtiltを
  無効にして直接移動だけにする。
- keyboard利用者にはdragを要求せず、すべての連絡先を通常のlinkとして提供する。

## Home composition contract

- `ThemeGlyph`のtight viewBoxをHeaderとHome titleで共有する。Lightはfilled circle一つだけとし、
  crescentと同じ外接正方形・重心へ合わせる。Home titleのmotifも同じtheme toggleとして操作できる。
- Introductionは移動しない通常flowとしてprofile cardの下へ置く。
- Engineeringはroot dependency、config、accepted docsで確認できた技術だけをcategory別に表示する。
  native/mobile stackは確認できないためMobile categoryを推測で追加しない。
- Home visual backgroundはcontent max-widthから切り離し、HeroとAboutを連続して覆う。中央Canvas/SVGの
  構図は先頭200svhへ保ち、Aboutが内容で伸びても背景要素の端を露出させない。
- Display Offでは既存世界観と一致しない中央SVGを隠す。新しい仮SVGは作らない。
- WebGL非対応時も不整合な中央SVGは代替表示せず、静的天候環境とtypographyだけを残す。Home shaderは
  共通32秒phaseでloop端を一致させ、non-Home CSSもtile周期の整数移動で継ぎ目をなくす。
- Home shaderはclearの木漏れ日状光条、cloudyの靄、rainのガラス面水滴、snowの降雪・積雪を同じ
  controller内のweightで補間する。中央Hero点群はlow 1400 / high 3200まで増やし、点径も拡大する。
- Displayとmobile menuのcontentはboxを持たない縦text disclosureとし、open/closeを短く補間する。
- root mandatory snapにHome限定36px wheel accumulatorを加え、nested scrollを優先し、 1
  gestureで隣接1区間だけへ移動する。keyboard/touchはbrowser標準を維持する。

## Architectural change

Accepted architectureの「drag/touchは中央Heroだけ」という記述は今回の明示要件と競合する。
実装とは別に、Home Aboutのprofile cardにも領域内へ制限した任意の装飾dragを認める文言へ更新する。
Home以外のinteractionとWebGL loadingは変更しない。Accepted architectureには、profile cardの
非永続inertia、Home限定snap assist、Minimal時の中央motif非表示、Aboutが内容に応じて伸びる full-bleed
visual layerを明記する。

## Milestones

- [x] Card props、icons、theme token、Home compositionを小型名刺へ整理
- [x] Pointer/touch drag、inertia、bounds、resize、cleanup、reduced motionを実装
- [x] Theme motif、Introduction、Engineering、Minimal fallback、full-bleed backgroundを実装
- [x] Home限定snap assistとsmall trackpad gesture testを実装
- [x] Story、component/E2E assertions、accepted docsを最終更新
- [x] Format、lint、design、Svelte、tests、build/budget、visual確認

## Validation

実行結果:

- `deno task fmt:check`、`deno task lint`、`deno task design:check`、`deno task check`: pass
- `deno task test`: Deno 23 / Vitest 11 pass
- `deno task build`: pass
- `deno task budget:check`: Article 109.2 KiB / 150 KiB、Home WebGL 224.7 KiB / 230 KiB
- `UPDATE_VISUAL_BASELINES=true deno task storybook:check`: 61 stories pass
- `deno run -A packages/ui/scripts/check-storybook.ts`: 更新なしのbaseline再比較を含め61 stories
  pass
- `deno task test:e2e --workers=1`: 28 pass / 47 project別skip
- Chromiumで4天候のWebGL shader、title/Header theme同期、名刺drag後opacity、Mobile
  disclosureを確認し、console/page errorなし

## Working-tree note

開始時点には前タスクを含む多数のユーザー所有の未コミット変更がある。今回の名刺、icon registry、
theme token、Home composition、関連story/test/docs以外は変更・破棄しない。
