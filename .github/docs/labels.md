# GitHub CLI とプロジェクトラベルの設定手順

このドキュメントでは、GitHubCLI（`gh`）の導入手順と、
本プロジェクトで採用しているのIssue/PR用ラベルを自動構築する手順を解説します。

---

## 1. GitHub CLI (`gh`) のセットアップ

GitHub Actionsやラベルの管理をターミナルから高速に行うため、GitHub CLIを導入します。

### 1. インストール

お使いの環境に合わせて以下のコマンドを実行してください。

```bash
# Mac
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
sudo apt update && sudo apt install gh -y
```

### 2. GitHubへのログイン認証

インストール完了後、以下のコマンドを実行してログインを行います。

```bash
gh auth login
```

## 2. ラベルの一括セットアップ

```bash
# 1. 既存のデフォルトラベルを全削除
labels=(
  "bug"
  "documentation"
  "duplicate"
  "enhancement"
  "good first issue"
  "help wanted"
  "invalid"
  "question"
  "wontfix"
)

for label in "${labels[@]}"; do
  gh label delete "$label" --yes 2>/dev/null
done

# 2. ラベルを生成
gh label create feat     --color "0E8A16" --description "新機能の追加"
gh label create bug      --color "D93F0B" --description "不具合・バグの修正"
gh label create chore    --color "6E7681" --description "開発環境、CI/CD、ライブラリの更新"
gh label create refactor --color "5319E7" --description "コードの整理・改善（挙動は変えない）"
gh label create docs     --color "0075CA" --description "ドキュメントの追加・更新（READMEなど）"
gh label create ui       --color "F9D0C4" --description "デザイン、スタイル、見た目の微調整"
gh label create blocked  --color "E11D21" --description "他タスクや外部要因による保留・ストップ状態"
```
