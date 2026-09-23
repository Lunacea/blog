/**
 * テスト用ブラウザへ渡す環境変数。エディタが開発コンテナへ Wayland や X の表示先を渡していると、
 * ヘッドレスの Chromium もそこへ描画面を作ろうとし、ソフトウェア描画（SwiftShader）の初期化に
 * 失敗して WebGL が使えなくなる。ヘッドレスでは表示先を持たせない。
 */
export function headlessBrowserEnv(): Record<string, string> {
  const env = Deno.env.toObject();
  delete env.WAYLAND_DISPLAY;
  delete env.DISPLAY;
  return env;
}
