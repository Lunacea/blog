# Motion

ルートとUIパッケージの指示を継承する。motionは状態と連続性を伝える補助とする。

- duration、easing、再利用keyframesは`foundations/theme.css`に置く。
- 頻繁なアニメーションはtransform/opacityを優先し、継続的なlayout測定を避ける。
- Home openingはHomeのみ、約1〜2秒で非ブロッキング。WebGLやフォントを待たず、
  細かな状態更新で再生し直さない。記事や検索結果には追加しない。
- 遷移は現在の`page-transitions.ts`とarchitectureの契約を維持する。
  履歴、アンカー、フォーカス・スクロール復元、素早い再遷移を妨げない。
- reduced motionではopening、parallax、大きな移動、装飾ループを停止する。機能や内容は残す。
- 非表示タブ、画面外、低性能端末ではambient motionを停止し、unmount時に購読とframeを解除する。
- アプリ全体の不要なループやアニメーション依存を増やさない。ネイティブカーソルを維持する。
- 変更に応じてキーボード、reduced motion、中断・履歴遷移、touch、hidden tab、layout
  shiftを確認する。
