# Deno Deploy公開runbook

このrunbookは新Deno DeployのGitHub連携とTimelineを対象にします。Deploy
Classicと`deployctl`は使いません。外部サービスの画面操作は認証済みの所有者が実施し、値はDeno
DeployとCloudflareの画面に表示されたものを正として転記します。

## 1. 事前ゲート

```bash
deno install --frozen --allow-scripts=npm:sharp
deno task fmt:check
deno task lint
deno task check
deno task test
deno task build
deno task budget:check
deno task test:e2e
```

実コンテンツへの置換が終わるまでは`packages/config/mod.ts`の`sampleMode: true`を維持します。実績、著者、canonical
URLを確認し、サンプルが0件になってから`false`へ切り替えます。

## 2. AppとGitHub

1. Deno Deployで新規Appを作り、対象GitHub repositoryを接続する。
2. App directoryを`apps/web`にする。これはsource code内からは指定できないモノレポ設定である。
3. Framework
   presetが`sveltekit`、installが`deno install --frozen --allow-scripts=npm:sharp`、buildが`deno task build`になっていることを確認する。`apps/web/deno.json`がダッシュボード値より優先される。
4. Preview TimelineはPR/branch、Production Timelineは保護された公開branchへ接続する。

SvelteKitはDeno Deployでネイティブ対応されており、追加adapterや独自entrypointは不要です。参考:
https://docs.deno.com/deploy/reference/frameworks/ と https://docs.deno.com/deploy/reference/builds/

## 3. ランタイム設定

1. 32
   byte以上のランダム値を生成し、`REACTION_SIGNING_SECRET`としてDevelopment/PreviewとProductionのruntime
   contextへ別々に登録する。
2. Deno DeployのDatabasesでDeno KVをprovisionし、Appへassignする。
3. PreviewとProductionで別のKVが接続されることを確認する。TimelineごとのDB分離と`Deno.openKv()`の接続先選択はDeno
   Deployが行う。
4. Build contextへ秘密鍵を置かない。Production/Developmentの値はbuild時には参照されない。

参考: https://docs.deno.com/deploy/reference/deno_kv/

## 4. 標準ドメインで検証

最初のRevisionをPreviewへrouteし、表示された`*.deno.net` URLに対して実行します。

```bash
E2E_BASE_URL=https://<preview-host> deno task test:e2e
curl -fsS https://<preview-host>/api/v1/health
curl -fsSI https://<preview-host>/rss.xml
curl -fsSI https://<preview-host>/sitemap.xml
curl -fsSI https://<preview-host>/og/article/<slug>.png
```

リアクションを一度追加・取消しし、再読込後の選択状態、KV集計、Origin拒否、429、ログとtraceを確認します。404がHTTP
404で専用画面になることも確認します。

## 5. `blog.lunacea.jp`

1. Deno DeployのOrganization Domainsへ`blog.lunacea.jp`を追加する。
2. Domain drawerが示すrouting/verificationレコードをCloudflare
   DNSへそのまま登録する。subdomainには通常CNAME方式を使えるが、表示値を推測しない。
3. `_acme-challenge`のCNAMEだけはCloudflare proxyを必ず無効（DNS only）にする。
4. Deno Deployで検証とLet's Encrypt証明書発行を完了する。
5. 検証済みAppのProduction Timelineへdomainをassignする。

参考: https://docs.deno.com/deploy/reference/domains/

既存domain/Revisionは、新Revisionの標準URL・TLS・主要導線が通るまで削除しません。

## 6. 公開後と復旧

- `/`、Articles、Works、Talks、Archive、About、タグ、検索をPC/モバイルで確認する。
- canonical、JSON-LD、OGP、RSS、Atom、Sitemap、robotsを確認する。
- Light/Dark/Auto、Full/Reduced/Off、JS無効、WebGL fallbackを確認する。
- health、天候fallback、都市検索、リアクションのKV書込みを確認する。
- Deno Deployのbuild/runtime logsとtracesに継続エラーがないことを確認する。
- TLS chainと証明書対象hostを確認する。

異常時はProduction Timelineのroutingを直前の正常Revisionへ戻します。データ破壊を伴わないためKV
assignmentとdomainは維持します。原因修正は新しいPreview
Revisionで再検証し、正常化してからProductionへrouteします。
