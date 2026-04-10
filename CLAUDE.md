# ob-extractor — CLAUDE.md

Open Badges v2.0 / v3.0 のバッジ画像（PNG / SVG）またはアサーション URL を入力して、メタデータを抽出・表示するフロントエンド専用 Web アプリ。**全 6 フェーズ実装済み。**

## ドキュメント

- `docs/requirements.md` — 要件定義書（ユーザーストーリー・機能要件・非機能要件）
- `docs/architecture.md` — 技術設計書（ディレクトリ構成・データフロー・型定義）
- `docs/open-badges-spec.md` — Open Badges 仕様リファレンス（PNG/SVG ベイキング解析含む）

## 技術スタック

| 項目 | 採用技術 |
|------|---------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite 8 |
| スタイリング | Tailwind CSS v4（`@tailwindcss/vite` プラグイン） |
| テスト | Vitest 4 + jsdom |
| JSON ビューア | react-json-view-lite |

**設計方針:** フロントエンドのみで動作（バッジデータをサーバーに送らない）

## コマンド

```bash
npm run dev          # 開発サーバー起動 (http://localhost:5173)
npm test             # テスト実行（90 テスト）
npm run test:watch   # テストウォッチモード
npm run test:coverage # カバレッジレポート
npm run build        # プロダクションビルド
```

## ディレクトリ構成（実装済み）

```
src/
  types/
    badges.ts              # v2.0/v3.0 TypeScript 型定義・BadgeExtractionError・ComplianceWarning
  lib/
    extract.ts             # extractFromFile / extractFromUrl（統合エントリポイント）
    extractors/
      png.ts               # PNG iTXt チャンク抽出 → PngExtractionResult { text, warnings }
      svg.ts               # SVG DOMParser 抽出（script#openbadges タグ）
      url.ts               # fetch + CORS / 404 / ネットワークエラー分類
    parsers/
      detect.ts            # v2.0 / v3.0 バージョン検出 + JSON パース
      v2.ts                # v2.0 Assertion → NormalizedBadgeV2 正規化 + 仕様準拠チェック
      v3.ts                # v3.0 Credential → NormalizedBadgeV3 正規化 + 仕様準拠チェック
    resolver.ts            # 外部参照（BadgeClass / Issuer）fetch リゾルブ
    __tests__/
      png-helper.ts        # テスト用 PNG バイナリ生成（CRC32 実装）
      detect.test.ts       # 17 テスト
      v2.test.ts           # 22 テスト
      v3.test.ts           # 19 テスト
      svg.test.ts          # 7 テスト
      png.test.ts          # 7 テスト
      url.test.ts          # 5 テスト
      resolver.test.ts     # 13 テスト
  components/
    BadgeInput.tsx         # ファイルアップロード（DnD）+ URL 入力
    SummaryPanel.tsx       # 概要パネル（バッジ画像 placeholder 付き）
    DetailTabs.tsx         # タブ詳細（ARIA タブパターン実装済み）
    JsonViewer.tsx         # JSON ツリー表示 + コピーボタン
    MetadataView.tsx       # SummaryPanel + ComplianceWarnings + DetailTabs の統合コンテナ
    VersionBadge.tsx       # v2.0（青）/ v3.0（紫）バッジラベル
    ErrorMessage.tsx       # エラーコード付き赤アラート
  App.tsx                  # idle / loading / success / error 状態管理
  main.tsx
  index.css                # @import "tailwindcss"
```

## 重要な実装メモ

### PNG 解析
- iTXt チャンクのキーワードは **2 種類**を受け付ける:
  - `openbadges` — v2.0 および一部の v3.0
  - `openbadgecredential` — v3.0（Open Badge Factory 等）
- チャンク構造: `4B 長さ + 4B タイプ + データ + 4B CRC`
- `extractFromPng` は `{ text: string; warnings: ComplianceWarning[] }` を返す
- テキスト先頭の null バイト（`\0`）を検出 → 除去しつつ `png.itxt.leading_null_byte` 警告を生成
- compression flag が 1 の場合は `BadgeExtractionError('NO_METADATA')` を投げる（稀なケース、将来対応）
- 詳細アルゴリズムは `docs/open-badges-spec.md` 参照

### SVG 解析
- `DOMParser` で XML パース → `script#openbadges[type="application/ld+json"]` を取得
- fallback: `script[type="application/ld+json"]`（id なし）

### バージョン判定（優先順位順）
1. `proof` フィールドあり → v3.0
2. `type[]` に `"VerifiableCredential"` → v3.0
3. `@context[]` に `"https://www.w3.org/ns/credentials/v2"` または `"w3id.org/badges/v3"` → v3.0
4. `verify` または `verification` フィールドあり → v2.0
5. `@context` に `"w3id.org/badges/v2"` または `"w3id.org/openbadges/v2"` → v2.0（文字列・配列両対応）
6. それ以外 → unknown（v2 として試みる、`version.unknown` 警告を追加）

### 仕様準拠チェック（ComplianceWarning）
- 抽出・パース時に仕様違反を検出し、バッジに `warnings: ComplianceWarning[]` として付与
- `MetadataView` がサマリーとタブの間に黄色い警告パネルで表示
- バッジの表示自体はブロックしない（警告付きで表示継続）

**検出項目一覧:**

| コード | 検出条件 |
|---|---|
| `png.itxt.leading_null_byte` | iTXt テキスト先頭に null バイト |
| `v2.badge.missing` | `badge` フィールドなし |
| `v2.recipient.missing` | `recipient` フィールドなし |
| `v2.issuedOn.missing` | `issuedOn` フィールドなし |
| `v2.verify.missing` | `verify` も `verification` もなし |
| `v2.verify.field_name` | `verify` の代わりに `verification` |
| `v2.verify.type_invalid` | `verify.type` が `"hosted"` / `"signed"` 以外 |
| `v3.issuer.missing` | `issuer` フィールドなし |
| `v3.credentialSubject.missing` | `credentialSubject` フィールドなし |
| `v3.validFrom.missing` | `validFrom` も `awardedDate` もなし |
| `v3.validFrom.non_standard` | `validFrom` の代わりに `awardedDate` |
| `v3.achievement.tag_field_name` | `tags` の代わりに `tag`（単数形） |
| `version.unknown` | バージョン自動判定失敗 |
| `url.http_error` | URL が HTTP 2xx 以外を返した（params: `field`, `url`, `status`） |
| `url.image_broken` | 画像 URL の読み込み失敗（params: `field`, `url`） |
| `url.network_error` | URL に到達不可（params: `field`, `url`） |

### URL ヘルスチェック（`src/lib/checkers/url-health.ts`）
- リゾルブ完了後、バッジ内の全 HTTP(S) URL を収集して到達確認する
- **画像 URL**（`*.image` フィールド）: `Image` オブジェクトで確認（CORS 非依存）
- **その他 URL**: `fetch HEAD` + cors → CORS エラー時は `fetch GET` + no-cors で再確認
- タイムアウト: 10 秒
- `ComplianceWarning` として `badge.warnings` に追記（表示はブロックしない）

### 外部参照リゾルブ
- v2.0: `badge`（BadgeClass URL）→ fetch → `issuer`（Issuer URL）→ fetch
- v3.0: `issuer.id`（URL）→ fetch
- 失敗時（CORS・404 含む）は null を返して握り潰す（URL 文字列のまま保持）
- fetch 深度上限: 2（循環参照防止）
- `http://` / `https://` 以外の URI（`urn:` 等）はリゾルブしない

### CORS 対応
- 外部 URL fetch は CORS エラーが起きる場合がある
- エラー種別を `BadgeExtractionError.code` で分類（`FETCH_CORS` / `FETCH_NOT_FOUND` / `FETCH_NETWORK`）
- プロキシは使わない方針。エラーメッセージで UX カバー

### アクセシビリティ対応済み
- DetailTabs: `role="tablist/tab/tabpanel"` + `aria-controls` / `aria-labelledby` + 矢印キー操作
- BadgeInput: loading 中は `aria-disabled` + `tabIndex={-1}`
- App: `aria-live="polite"` / `role="status"`（ローディング）

### TypeScript 設定の注意
- `erasableSyntaxOnly: true` → クラスのコンストラクタ引数に `public readonly` 不可
  - `BadgeExtractionError` は通常の `this.code = code` 形式で実装している
- テスト設定は `vitest/config` の `defineConfig` を使う（`vite` の `defineConfig` では `test` フィールドが型エラーになる）
