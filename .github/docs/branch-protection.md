# ブランチの保護ルール

`main`と`develop`のbranch protectionまたはrulesetで、次のstatus checksを必須にします。
名前はworkflowのjob名と一致させてください。

- `Format, lint, test, build, E2E`（Quality gate）
- `タイトル検証およびラベル自動付与`（PR Governance）

PR経由の変更と最新base branchでのチェック成功を要求し、force pushとbranch削除を禁止します。
管理者への適用とレビュー人数はリポジトリの運用に合わせて設定してください。

旧チェック名`🧪 静的解析とテストの実行`が残っている場合は、現在のQuality gate名へ変更します。
この文書やworkflowの編集だけでは、GitHub上の保護設定は変更されません。

CDは`repository_dispatch`で後から実行されるため、PRの必須チェックにはしません。
