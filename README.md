# BadgeLens

**Open Badges v2.0 / v3.0 Metadata Viewer & Compliance Checker**

BadgeLens extracts and displays metadata from Open Badge images (PNG / SVG) or assertion URLs directly in your browser — no server, no uploads.

---

## Features

- **Drag & drop or click** to load a PNG or SVG badge file
- **Assertion URL** input to fetch badge metadata from a remote endpoint
- **Supports Open Badges v2.0 and v3.0** — auto-detects the version
- **Compliance checker** — flags spec violations as warnings without blocking display
- **Structured view** — summary panel, per-object tabs (Assertion / BadgeClass / Issuer / Credential / Achievement / Proof), and raw JSON tree
- **Privacy first** — all processing happens in your browser; badge data is never sent to any server
- **Bilingual UI** — English or Japanese, auto-detected from your browser language

## Compliance checks

BadgeLens detects the following specification violations and displays them as warnings:

| Code | Condition |
|---|---|
| `png.itxt.leading_null_byte` | iTXt text field starts with a null byte (0x00) |
| `v2.badge.missing` | `badge` field is absent (required) |
| `v2.recipient.missing` | `recipient` field is absent (required) |
| `v2.issuedOn.missing` | `issuedOn` field is absent (required) |
| `v2.verify.missing` | Neither `verify` nor `verification` field is present |
| `v2.verify.field_name` | Field is named `verification` instead of `verify` |
| `v2.verify.type_invalid` | `verify.type` is not `"hosted"` or `"signed"` |
| `v3.issuer.missing` | `issuer` field is absent (required) |
| `v3.credentialSubject.missing` | `credentialSubject` field is absent (required) |
| `v3.validFrom.missing` | `validFrom` field is absent (required) |
| `v3.validFrom.non_standard` | `awardedDate` used instead of `validFrom` |
| `v3.achievement.tag_field_name` | `tag` (singular) used instead of `tags` |
| `version.unknown` | Badge version could not be auto-detected |

## Tech stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Testing | Vitest 4 + jsdom |
| JSON viewer | react-json-view-lite |

## Getting Started

**Prerequisites:** Node.js 18 or later

```bash
git clone https://github.com/infosign/badge-lens.git
cd badge-lens
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To stop the dev server, press `Ctrl+C` in the terminal.

## Other commands

```bash
npm test             # run all tests (90 tests)
npm run build        # production build
npm run preview      # preview production build locally
```

## License

MIT © 2026 [Infosign, Inc.](https://www.infosign.co.jp/)

---

# BadgeLens（日本語）

**Open Badges v2.0 / v3.0 メタデータビューア & 仕様準拠チェッカー**

BadgeLens は、Open Badge の画像ファイル（PNG / SVG）またはアサーション URL からメタデータを抽出・表示するブラウザ完結型のツールです。サーバーへのアップロードは一切不要です。

---

## 機能

- **ドラッグ＆ドロップまたはクリック**で PNG / SVG バッジファイルを読み込む
- **アサーション URL** を入力してリモートからバッジメタデータを取得する
- **Open Badges v2.0 / v3.0 に対応** — バージョンを自動判定
- **仕様準拠チェック** — 仕様違反を警告として表示しつつ、バッジの表示は継続
- **構造化ビュー** — サマリーパネル、オブジェクト別タブ（Assertion / BadgeClass / Issuer / Credential / Achievement / Proof）、生 JSON ツリー
- **プライバシー重視** — すべての処理はブラウザ内で完結。バッジデータは外部サーバーに送信されません
- **バイリンガル UI** — ブラウザの言語設定に応じて日本語 / 英語を自動切り替え

## 仕様準拠チェック一覧

| コード | 検出条件 |
|---|---|
| `png.itxt.leading_null_byte` | iTXt テキストフィールドの先頭に null バイト（0x00）がある |
| `v2.badge.missing` | `badge` フィールドがない（必須） |
| `v2.recipient.missing` | `recipient` フィールドがない（必須） |
| `v2.issuedOn.missing` | `issuedOn` フィールドがない（必須） |
| `v2.verify.missing` | `verify` も `verification` もない |
| `v2.verify.field_name` | `verify` ではなく `verification` というフィールド名を使用 |
| `v2.verify.type_invalid` | `verify.type` が `"hosted"` / `"signed"` 以外 |
| `v3.issuer.missing` | `issuer` フィールドがない（必須） |
| `v3.credentialSubject.missing` | `credentialSubject` フィールドがない（必須） |
| `v3.validFrom.missing` | `validFrom` フィールドがない（必須） |
| `v3.validFrom.non_standard` | `validFrom` の代わりに `awardedDate` を使用 |
| `v3.achievement.tag_field_name` | `tags` の代わりに `tag`（単数形）を使用 |
| `version.unknown` | バッジのバージョンを自動判定できなかった |

## 技術スタック

| | |
|---|---|
| フレームワーク | React 19 + TypeScript |
| ビルド | Vite 8 |
| スタイリング | Tailwind CSS v4 |
| テスト | Vitest 4 + jsdom |
| JSON ビューア | react-json-view-lite |

## 始め方

**必要環境:** Node.js 18 以上

```bash
git clone https://github.com/infosign/badge-lens.git
cd badge-lens
npm install
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開いてください。

開発サーバーを停止するにはターミナルで `Ctrl+C` を押してください。

## その他のコマンド

```bash
npm test             # テスト実行（90 テスト）
npm run build        # プロダクションビルド
npm run preview      # ビルド結果をローカルで確認
```

## ライセンス

MIT © 2026 [株式会社インフォザイン](https://www.infosign.co.jp/)
