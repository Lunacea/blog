# UIパッケージ

ルートの指示を継承する。共通UIはSvelte 5、Tailwind CSS 4、Bits UIとローカルの
shadcn-svelteプリミティブで構成する。共通契約は`docs/design-system.md`を参照する。

## 配置と再利用

- `foundations`：テーマ・global CSS・フォント。値の正本は`src/foundations/theme.css`。
- `primitives`：低レベルUI、`layout`：配置、`components`：単一責務UI、`patterns`：セクション。
- `icons`：アイコン、`motion`：遷移・アニメーション、`visuals`：アセット・WebGL。
- URL、ルーティング、データ取得、repository、SEOはUIに持ち込まない。
- 既存プリミティブ、shadcn-svelte、Bits
  UIの順に再利用する。React版や重複フレームワークを追加しない。
- ルートやpatternからBits UIを直接使わずローカルプリミティブを通す。
- フォーカス管理やARIAを見た目のために独自実装しない。

## 表示

- 専用utility・variantがある場合は任意property・selectorより優先する（`transform-[…]`、`**:data-asset-placeholder:*`など）。
- 通常のスタイルは静的なTailwindクラス。差分は`cn()`、状態は`data-*`、group、peer、variant。
- クラス名を文字列補間で組み立てない。任意値は既存トークンで表現できない一度限りの値に限定する。
- 再利用する色、寸法、余白、文字、影、motion、easing、z-indexはthemeへ置く。
- Iconifyは`Icon.svelte`を通す。一般UIはSolar linear、公式ブランドはSimple Icons。
- アイコン操作にアクセシブルネームを付ける。UIの装飾やfallbackに絵文字を使わない。
- 日本語の行長・行間・改行を維持する。カード、境界線、影、blur、pillには機能・構成上の理由を持たせる。
- 著作素材が不足する場合は`AssetPlaceholder`でID、役割、比率、形式、代替テキスト、透過要否を示す。
- GIFはユーザー提供のみ。reduced motionでは承認済み静止画へ置換し、なければ自動再生しない。
- ネイティブスクロールとカーソルを維持する。スクロールバーを完全に隠さない。

## 確認

共通UIは変更の影響がある代表的な利用箇所を確認する。Storybook専用の部品も利用中として扱うが、
毎回の全story build・E2Eは不要。記法のみなら生成CSSや型、動作変更なら関連操作、
描画負荷の変更なら対象端末のスクロール・縮退・cleanupを優先する。
