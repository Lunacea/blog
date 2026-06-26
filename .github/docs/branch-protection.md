# ブランチの保護ルール

バグや命名ルール違反のコードが `main` に直接プッシュ、
またはCI未通過のままマージされるのを防ぐガードレールを設定します。

## 設定コマンド

以下を実行することで、GitHub API経由で `main` ブランチに保護ルールが適用されます。

```bash
# 1. 設定内容を一時JSONファイルとして出力
cat << 'EOF' > protection.json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "🧪 静的解析とテストの実行" },
      { "context": "タイトル検証およびラベル自動付与" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# 2. GitHub APIを実行してmainブランチにルールを適用
gh api repos/:owner/:repo/branches/main/protection --method PUT --input protection.json

# 3. 一時ファイルの削除
rm -f protection.json
```

以下を実行し `develop` ブランチも同様に保護ルールを適用します。

```bash
# 1. 設定内容を一時JSONファイルとして出力
cat << 'EOF' > protection_develop.json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "🧪 静的解析とテストの実行" },
      { "context": "タイトル検証およびラベル自動付与" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# 2. GitHub APIを実行してdevelopブランチにルールを適用
gh api repos/:owner/:repo/branches/develop/protection --method PUT --input protection_develop.json

# 3. 一時ファイルの削除
rm -f protection_develop.json
```
