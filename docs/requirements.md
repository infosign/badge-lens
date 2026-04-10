# 要件定義書 — Open Badges メタデータビューア

## 1. プロダクト概要

Open Badges v2.0 / v3.0 に準拠したバッジ画像またはアサーション URL を入力すると、バッジに埋め込まれたメタデータを抽出・表示する Web アプリ。

**主な用途**
- バッジ発行者がバッジの内容確認に使う
- バッジ受領者が自分のバッジの詳細を確認する
- 開発者がバッジの仕様・構造を検証する

---

## 2. スコープ

### 対応する仕様バージョン

| バージョン | 仕様 | 状態 |
|-----------|------|------|
| Open Badges v2.0 | IMS Global OB 2.0 | 実装済み |
| Open Badges v3.0 | IMS Global OB 3.0 (Verifiable Credentials ベース) | 実装済み |

### スコープ外

- バッジの発行・生成機能
- バッジの暗号署名検証（v3.0 の DataIntegrityProof 検証）
- バッジのベイキング（baking）機能

---

## 3. ユーザーストーリー

| # | ストーリー | 優先度 | 状態 |
|---|-----------|--------|------|
| US-01 | PNG バッジ画像をアップロードしてメタデータを確認したい | Must | 実装済み |
| US-02 | SVG バッジ画像をアップロードしてメタデータを確認したい | Must | 実装済み |
| US-03 | アサーション URL を入力してメタデータを取得・表示したい | Must | 実装済み |
| US-04 | バッジが v2.0 か v3.0 かを一目で判別できる表示にしてほしい | Must | 実装済み |
| US-05 | 抽出したメタデータをフィールドごとに整理された形で閲覧したい | Must | 実装済み |
| US-06 | JSON の生データも確認できるようにしてほしい | Should | 実装済み |
| US-07 | 外部参照（BadgeClass、Issuer）もリゾルブして表示してほしい | Should | 実装済み |
| US-08 | バッジ画像をドラッグ＆ドロップでアップロードしたい | Should | 実装済み |
| US-09 | 入力エラーや非対応ファイルの場合はわかりやすいメッセージを表示してほしい | Must | 実装済み |

---

## 4. 機能要件

### 4.1 入力

#### ファイルアップロード

| 要件 | 詳細 |
|------|------|
| 対応フォーマット | PNG、SVG |
| アップロード方法 | ファイル選択ダイアログ、ドラッグ＆ドロップ |
| ファイルサイズ上限 | 10 MB（クライアントサイドで処理するため） |
| バリデーション | MIME タイプ・拡張子チェック、PNG/SVG 構造チェック |
| ローディング中 | ドロップゾーン・ボタンを無効化（aria-disabled） |

#### URL 入力

| 要件 | 詳細 |
|------|------|
| 入力形式 | アサーション URL（JSON-LD を返す HTTP エンドポイント） |
| HTTPS | 推奨（HTTP も許容） |
| CORS | CORS エラー発生時はエラーメッセージを表示 |

### 4.2 メタデータ抽出

#### PNG バッジ

- PNG バイナリを読み込み、チャンクを順に解析
- `iTXt` チャンクのキーワード `"openbadges"` を検出
- テキスト部分の JSON-LD を抽出してパース
- 圧縮済み iTXt チャンクは非対応（`NO_METADATA` エラー）

#### SVG バッジ

- SVG を XML としてパース（DOMParser）
- `<script id="openbadges" type="application/ld+json">` タグを検索
- fallback: `<script type="application/ld+json">` タグ
- innerText の JSON-LD を抽出してパース

#### URL

- HTTP GET でアサーション JSON を取得
- Accept ヘッダ: `application/json, application/ld+json, */*`

### 4.3 バージョン検出

| 条件 | 判定 |
|------|------|
| `proof` フィールドあり | v3.0 |
| `type` 配列に `"VerifiableCredential"` 含む | v3.0 |
| `@context` 配列に W3C VC / v3 URL 含む | v3.0 |
| `verify` フィールドあり | v2.0 |
| `@context` に v2 URL 含む | v2.0 |
| その他 | unknown（v2 として試みる） |

### 4.4 外部参照リゾルブ

- v2.0: `badge`（BadgeClass URL）→ fetch → `issuer`（Issuer URL）→ fetch
- v3.0: `issuer.id` が URL の場合は fetch
- fetch に失敗した場合は URL をそのまま保持（エラーは握り潰す）
- 循環参照防止のため fetch 深度を 2 に制限
- `urn:` など HTTP(S) 以外 URI はリゾルブしない

### 4.5 表示

#### 概要パネル（SummaryPanel）

| 表示項目 | v2.0 | v3.0 |
|---------|------|------|
| バッジ名 | `badge.name` | `name` / `achievement.name` |
| バッジ画像 | `badge.image`（失敗時は placeholder） | `image` / `achievement.image` |
| 説明 | `badge.description` | `description` / `achievement.description` |
| 受領者 | `recipient.identity` | `credentialSubject.id` |
| 発行日 | `issuedOn` | `validFrom` |
| 有効期限 | `expires` | `validUntil` |
| 発行者名 | `issuer.name`（未リゾルブ時は URL リンク） | `issuer.name` |
| バージョン | バッジラベル表示 | バッジラベル表示 |
| 取得条件 | `badge.criteria.narrative` | `achievement.criteria.narrative` |
| タグ | `badge.tags` | `achievement.tags` |

#### 詳細パネル（DetailTabs）

- v2.0 タブ: `Assertion` / `BadgeClass` / `Issuer` / `JSON`
- v3.0 タブ: `Credential` / `Achievement` / `Issuer` / `Proof` / `JSON`
- URL 値はクリッカブルリンクとして表示

#### JSON ビューア

- react-json-view-lite によるツリー表示（デフォルト深さ 2 まで展開）
- コピーボタン（`navigator.clipboard.writeText`）

---

## 5. 非機能要件

| カテゴリ | 要件 | 状態 |
|---------|------|------|
| プライバシー | バッジデータをサーバーに送信しない（フロントエンドのみ） | 実装済み |
| 対応ブラウザ | Chrome / Firefox / Safari / Edge 最新版 | - |
| アクセシビリティ | ARIA タブパターン・aria-live・キーボード操作対応 | 実装済み |
| 国際化 | 日本語 UI | 実装済み |

---

## 6. エラーハンドリング

| エラーコード | 表示メッセージ例 |
|------------|----------------|
| `NOT_PNG` | 「PNG または SVG ファイルをアップロードしてください」 |
| `NOT_SVG` | 「SVG の解析に失敗しました」 |
| `NO_METADATA` | 「このファイルには Open Badges メタデータが含まれていません」 |
| `INVALID_JSON` | 「メタデータの JSON 解析に失敗しました」 |
| `FETCH_CORS` | 「URL の取得に失敗しました。CORS の制限が原因の可能性があります」 |
| `FETCH_NOT_FOUND` | 「指定された URL にアクセスできませんでした (404)」 |
| `FETCH_NETWORK` | 「ネットワークエラーが発生しました」 |
| `UNSUPPORTED_VERSION` | 「Open Badges として認識できないメタデータです」 |
