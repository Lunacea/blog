# Visuals

ルートとUIパッケージの指示を継承する。アセットとWebGLは本文・移動の任意拡張とする。

- 人物・植物・動物・ロゴ・写真などを捏造しない。素材不足時は`AssetPlaceholder`を使う。
- 非ブランドの幾何・構造・技術的SVGは可。複雑な著作素材を大量のpathで模倣しない。
- WebGLには明確な視覚的役割を持たせ、不要な高polygonモデルやshader実験を追加しない。
- 文字・重要情報はHTMLを正本とする。操作に意味がある場合はキーボードでも利用可能にする。
- 読み込み対象ページは`docs/architecture.md`に従う。dynamic importとidle loading、
  save-data、低性能、reduced motion、forced colors、WebGL非対応時の静止fallbackを維持する。
- 記事の初期依存にWebGL graphを含めない。静的な本文を初期化完了まで待たせない。
- 実行時の座標・比率だけをCSS custom propertiesで渡し、再利用値はthemeへ置く。
- 失敗時はcanvasを破棄して静止表示を残す。初期化を繰り返さず、本文上に技術エラーを表示しない。
- 非表示・画面外・Off・unmount・context loss時の停止とdisposeを維持する。
- スクロールイベントでは入力を記録し、寸法の読取り・canvas resize・描画は同じframeへまとめる。
  同じサイズでbufferを再確保しない。モバイルのbrowser barで背景高を連続変更しない。
- 変更に応じてfallback、motion設定、モバイル、no-JS、cleanup、route移動、build budgetを確認する。
