FROM denoland/deno:2.9.1

USER root

# システムアップデート、fish、git、curl、およびPlaywrightに必要なシステムの最低限の依存関係をインストール
RUN apt-get update && apt-get install -y \
    fish \
    git \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Deno公式イメージの deno ユーザー (デフォルトUID 1999等) をホストユーザーと一致させる (UID/GID 1000)
# LinuxやMac環境で発生しがちなファイルの書き込み権限エラーを防止
RUN usermod -u 1000 deno \
    && groupmod -g 1000 deno \
    && echo "deno ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ホームディレクトリの作成と権限設定
RUN mkdir -p /home/deno/.config/fish && chown -R deno:deno /home/deno

# プロジェクトの作業ディレクトリ作成と権限の事前割り当て
RUN mkdir -p /app/node_modules && chown -R deno:deno /app

# デフォルトシェルを fish に変更
RUN chsh -s /usr/bin/fish deno

WORKDIR /app

# Deno のキャッシュをコンテナ内の不揮発なホーム配下に固定
ENV DENO_DIR=/home/deno/.deno-cache

# HACK: Storybookを騙すためだけの超軽量ダミーnpmを設置（本物のNode/npmは不要）
RUN echo '#!/bin/sh\ncase "$1" in\n  --version) echo "10.8.2" ;;\n  *) exit 0 ;;\nesac' > /usr/local/bin/npm \
    && chmod +x /usr/local/bin/npm

USER deno

# fish プラグインマネージャー 'fisher' と、極上のプロンプト 'tide'、高速移動プラグイン 'z' をビルド時に焼き込む
RUN fish -c '\
    curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish \
    | source && \
    fisher install jorgebucaran/fisher && \
    fisher install ilancosman/tide@v6 && \
    fisher install jethrokuan/z \
    '

# tide プロンプトの初期設定をサイレント(デフォルト自動設定)で完了させ、初回起動時のセットアップウィザードを回避
RUN fish -c 'tide configure --auto --style=Lean --one-line=No --ascii=No --rainbow-style=Dark --8color=No --icons="Many icons" --transient=No'

# Playwrightのブラウザエンジンをコンテナイメージ構築時にダウンロード＆キャッシュ
ENV PLAYWRIGHT_BROWSERS_PATH=/home/deno/.cache/ms-playwright
RUN deno run -A npm:playwright install-deps chromium \
    && deno run -A npm:playwright install chromium

# 開発プロセスで使用するポートをコンテナ外へEXPOSE
EXPOSE 8000 5173 6006 8787 9323 51204 51205
