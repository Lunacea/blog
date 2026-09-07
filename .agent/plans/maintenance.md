# CI/CDとリポジトリ整理

## 目的と境界

生成処理の重複を減らし、本番ビルドをE2Eで検証する。未使用カーソル、旧draft、
過去の計画を整理し、現行の運用情報をREADME・docsと階層別AGENTSへ集約する。 公開URL、HTTP
API、データ、レンダリング・デプロイ境界、依存バージョンは維持する。

## 手順と受け入れ条件

1. CIの生成を一度にまとめ、同じPRの古い実行を取消す。既存のqualityチェック名を維持する。
2. CDは通知されたSHAとURLを検証して同じrevisionのテストを実行し、診断を保存する。
3. 参照のないカーソル実装と専用CSSを削除。旧計画の未実施事項は下記に引き継ぐ。
4. タスク・YAML・文書リンクを確認し、check、build、budget、E2EとStorybookを検証する。

## 判断と引き継ぎ

- 作業開始時のgit statusはclean。旧計画は後続の再設計で置換済み、履歴はGitで参照する。
- 実機iOS/Android・screen reader・本番KV/Deployの確認は公開時に必要。
- 旧WebGL文字表現案は未着手の提案で、現在の光の表現に置き換わっている。
- Storybookで使う実験的部品と公開コンテンツは維持する。
- インフラ設定変更やデプロイ、Gitへのcommit/pushは行わない。

## 検証結果

- `deno task check`の生成・content validationは成功。中断後、生成物を再利用して
  `deno task --cwd apps/web check`を再実行し、0 errors / 0 warnings。
- `deno task test`のDenoテスト25件成功。中断後の`deno task test:unit`は21件成功。
- `deno task --cwd apps/web build:prepared`、`deno task --cwd packages/ui build:prepared`成功。
- `deno task budget:check`成功：記事115.0 KiB gzip（上限150）、Home WebGL 127.8 KiB（上限230）。
- `deno task fmt:check`、`deno task lint`、`deno task design:check`成功。
  変更したAGENTS・workflow・文書もformat検証し、ローカル文書リンクと`git diff --check`は成功。
- YAML 3件をparseし、通知の正常・不正URL/欠落・不正SHA、PRタイトル/fork/既存labelの分岐を
  一時スクリプトで検証して成功。外部APIへの書き込みは行っていない。
- E2E初回で開発限定weather queryとmobileの閉じたcategory railを前提にしたテストを発見。 API
  fixtureとsummary操作へ修正した。全体実行と修正対象の再検証は進行中。
- GitHub Actions上の実行、実Deploy通知、実機・screen reader、本番KVは未検証。 GitHub上のbranch
  protectionも変更していない。

問題時は今回の対象ファイルのみをGit差分で戻せる。
