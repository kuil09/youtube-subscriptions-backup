# YouTube Subscriptions Manager（静的Web）

<p>
  <img src="public/logo-120.svg" width="120" height="120" alt="YouTube Subscriptions Manager ロゴ" />
</p>

YouTube のチャンネル登録リストを **エクスポート(Export)** して整理し、編集したファイルを **インポート(Import)** してブラウザから登録を追加/復元できる **静的Webアプリ**です。

読む言語: [English](README.md) | [한국어](README.ko.md) | **日本語**

## 主な機能
- 登録チャンネル数（件数）を表示
- 登録リストを **Export**（JSON/CSV）でダウンロード
- **Cleanup**：先に Export し、typed confirm（入力確認）後に全て登録解除
- 編集した Export ファイルを **Import** し、現在未登録のチャンネルのみを登録

UI は **한국어/English/日本語** に対応し、ブラウザ言語を既定として自動選択します（上部セレクタで変更可能）。

## 技術
- Vite + TypeScript
- Google OAuth: **Google Identity Services (GIS) Token Client**
- YouTube Data API v3

## 法的ページ（Google OAuth 審査で必須）
- プライバシーポリシー: `privacy.html`
- 利用規約: `terms.html`

デプロイ後（例: GitHub Pages のプロジェクトページ）通常は次の形式になります:
- `https://<ドメイン>/<パス>/privacy.html`
- `https://<ドメイン>/<パス>/terms.html`

## ローカル開発

```bash
npm install
npm run dev
```

この Web アプリはビルド時の環境変数が必要です:

- `VITE_GOOGLE_OAUTH_CLIENT_ID`

ローカル開発では起動前に設定してください:

```bash
export VITE_GOOGLE_OAUTH_CLIENT_ID="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
npm run dev
```

Vite が表示するURLを開いてください。

ビルド:

```bash
npm run build
```

本番ビルドのプレビュー:

```bash
npm run preview
```

## Google Cloud 設定（必須）

自分の Google Cloud プロジェクトと OAuth Client ID が必要です。

1) **API を有効化**
- Google Cloud Console で **YouTube Data API v3** を有効化します。

2) **OAuth Client ID を作成**
- OAuth クライアント種別は **Web application** で作成します。
- **Authorized JavaScript origins** にローカル/本番のオリジンを追加します。
  - 例: `http://localhost:5173`, デプロイ先ドメイン

3) **Client ID を設定**
- `VITE_GOOGLE_OAUTH_CLIENT_ID` をビルド時の環境変数として設定します。
- GitHub Pages デプロイの場合、GitHub Actions Secret に `VITE_GOOGLE_OAUTH_CLIENT_ID` を追加すると、ワークフローが `npm run build` 時に注入します。

## OAuth スコープ
- 読み取り（参照）の操作:
  - `https://www.googleapis.com/auth/youtube.readonly`
- 登録変更（登録解除/登録追加）の操作:
  - `https://www.googleapis.com/auth/youtube`

## OAuth セキュリティ
このアプリは OAuth のベストプラクティスを実装しています:
- **State パラメータ**: 各 OAuth リクエストで暗号学的に安全なランダムな state パラメータを生成し、CSRF 攻撃とセッション固定攻撃を防ぎます
- **State 検証**: OAuth コールバック時に state を検証し、不一致または欠落した state は拒否します
- **セッションストレージ**: State 値は `sessionStorage`（タブスコープ）に保存され、検証後に一度だけ使用されます
- **安全な乱数生成**: `crypto.getRandomValues()` を使用して 256 ビットのエントロピーで予測不可能な state 値を生成します

## Import フォーマット

### JSON（推奨）
JSON の Export には各項目の `channelId` が含まれます。Import は `channelId`（または `/channel/<id>` を含むURL）を想定します。

### CSV
CSV は最低でも `channelId` 列が必要です。

## 注意 / 安全
- **登録解除/登録追加は実アカウントに即時反映されます。** 必ず先に Export でバックアップしてください。
- 登録数が多い場合は quota/rate limit の影響を受けることがあります。アプリは backoff/pacing を行いますが失敗する可能性があり、失敗レポート(JSON)をダウンロードします。

## サポート
このアプリが役に立ったら、プロジェクトをサポートしてください:
- `https://buymeacoffee.com/e3pbwto`

## プロジェクト構成
- `index.html` — メインページ
- `src/web/` — Webアプリ（OAuth, i18n, UIロジック）
- `src/shared/` — 共通ユーティリティ/型

