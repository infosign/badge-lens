# 技術設計書 — Open Badges メタデータビューア

## 1. 技術スタック

| 項目 | 採用技術 | バージョン |
|------|---------|-----------|
| フレームワーク | React + TypeScript | React 19, TS 6 |
| ビルドツール | Vite | 8 |
| スタイリング | Tailwind CSS v4 | `@tailwindcss/vite` プラグイン |
| JSON ビューア | react-json-view-lite | 2.5 |
| テスト | Vitest + jsdom | 4 |

**設計方針: サーバーレス（フロントエンドのみ）**

---

## 2. ディレクトリ構成（実装済み）

```
src/
  types/
    badges.ts              # v2.0/v3.0 型定義・BadgeExtractionError・ComplianceWarning
  lib/
    extract.ts             # 統合エントリポイント（抽出 → 正規化 → リゾルブ）
    extractors/
      png.ts               # PNG iTXt チャンク抽出 → PngExtractionResult { text, warnings }
      svg.ts               # SVG script タグ抽出
      url.ts               # URL fetch + エラー分類
    parsers/
      detect.ts            # バージョン検出 + JSON パース
      v2.ts                # v2.0 → NormalizedBadgeV2 正規化 + 仕様準拠チェック
      v3.ts                # v3.0 → NormalizedBadgeV3 正規化 + 仕様準拠チェック
    resolver.ts            # 外部参照（BadgeClass / Issuer）リゾルブ
    __tests__/
      png-helper.ts        # テスト用 PNG バイナリ生成ユーティリティ
      detect.test.ts       # 17 テスト
      v2.test.ts           # 22 テスト
      v3.test.ts           # 19 テスト
      svg.test.ts          # 7 テスト
      png.test.ts          # 7 テスト
      url.test.ts          # 5 テスト
      resolver.test.ts     # 13 テスト
  components/
    App.tsx                # 状態管理（idle / loading / success / error）
    BadgeInput.tsx         # ファイルアップロード（DnD）+ URL 入力フォーム
    MetadataView.tsx       # SummaryPanel + ComplianceWarnings + DetailTabs の統合コンテナ
    SummaryPanel.tsx       # 概要パネル
    DetailTabs.tsx         # タブ詳細（ARIA タブパターン実装済み）
    JsonViewer.tsx         # JSON ツリー表示 + コピーボタン
    VersionBadge.tsx       # v2.0（青）/ v3.0（紫）バッジラベル
    ErrorMessage.tsx       # エラーコード付きアラート
  main.tsx
  index.css                # @import "tailwindcss"
```

---

## 3. データフロー

```
[ユーザー入力]
      │
      ├─ ファイル (PNG) → png.ts: ArrayBuffer → iTXt チャンク解析
      │                           → { text: JSON 文字列, warnings: ComplianceWarning[] }
      │                             ※ null バイト検出時に png.itxt.leading_null_byte を追加
      ├─ ファイル (SVG) → svg.ts: DOMParser → script#openbadges → JSON 文字列
      └─ URL           → url.ts: fetch (Accept: application/json) → JSON 文字列
                                  ↓ エラー種別分類
                          FETCH_CORS / FETCH_NOT_FOUND / FETCH_NETWORK

[JSON 文字列 + 抽出フェーズ警告]
      │
      └─ detect.ts: JSON.parse → バージョン判定 (v2.0 / v3.0 / unknown)
              │
              ├─ v2.ts: Assertion → NormalizedBadgeV2 + 仕様準拠チェック
              │         ※ verification エイリアス正規化・必須フィールド不在・verify.type 値
              ├─ v3.ts: Credential → NormalizedBadgeV3 + 仕様準拠チェック
              │         ※ 必須フィールド不在・awardedDate 代替・tag 単数形
              └─ unknown → v2.ts にフォールバック + version.unknown 警告を追加

[NormalizedBadge（未リゾルブ、warnings[] 付き）]
      │
      └─ resolver.ts: 外部 URL を fetch して BadgeClass / Issuer を展開
                      失敗時は null を返して握り潰す（URL 文字列のまま保持）

[NormalizedBadge（リゾルブ済み、warnings[] 付き）]
      │
      ├─ SummaryPanel:        name / image / issuer / recipient / date を表示
      ├─ ComplianceWarnings:  warnings[] がある場合に黄色い警告パネルを表示
      ├─ DetailTabs:          バージョン別タブで各フィールドを表示
      └─ JsonViewer:          生 JSON をツリー表示
```

---

## 4. 型定義 (`src/types/badges.ts`)

### v2.0

```typescript
interface V2Assertion {
  '@context': string | string[]
  type: string | string[]
  id: string
  badge: string | V2BadgeClass   // URL or inline object
  recipient: V2Recipient
  issuedOn: string
  verify?: V2Verification         // optional: 非標準実装では欠落する場合がある
  verification?: V2Verification   // 非標準エイリアス（一部実装）
  image?: string
  evidence?: V2Evidence | V2Evidence[]
  narrative?: string
  expires?: string
  revoked?: boolean
}

interface V2BadgeClass {
  id: string; name: string; description: string
  image: string; criteria: V2Criteria
  issuer: string | V2Issuer       // URL or inline object
  alignment?: V2Alignment[]; tags?: string[]
}

interface V2Issuer {
  id: string; name: string; url?: string
  email?: string; image?: string; description?: string
}
```

### v3.0

```typescript
interface V3Credential {
  '@context': string[]
  type: string[]
  id: string
  name?: string
  issuer: string | V3Issuer       // URL or inline object
  validFrom: string
  validUntil?: string
  credentialSubject: V3CredentialSubject
  proof?: V3Proof | V3Proof[]
}

interface V3Achievement {
  id: string; name: string; description?: string
  image?: string | V3Image
  criteria?: V3Criteria; tags?: string[]
}
```

### 表示用正規化型

```typescript
type NormalizedBadge = NormalizedBadgeV2 | NormalizedBadgeV3

interface NormalizedBadgeV2 {
  version: 'v2.0'
  raw: V2Assertion          // 生データ
  summary: NormalizedSummary
  assertion: V2Assertion
  badgeClass?: V2BadgeClass // リゾルブ済み or undefined
  issuer?: V2Issuer         // リゾルブ済み or undefined
  warnings: ComplianceWarning[]
}

interface NormalizedBadgeV3 {
  version: 'v3.0'
  raw: V3Credential
  summary: NormalizedSummary
  credential: V3Credential
  achievement?: V3Achievement
  issuer?: V3Issuer
  warnings: ComplianceWarning[]
}
```

### 仕様準拠警告型

```typescript
interface ComplianceWarning {
  code: string    // 機械可読なコード（例: "v2.verify.field_name"）
  message: string // ユーザー向け日本語メッセージ
}
```

警告は抽出・パースの各フェーズで収集され、最終的に `NormalizedBadge.warnings[]` に集約される。
バッジの表示はブロックせず、UI で黄色い警告パネルとして表示する。

### エラー型

```typescript
class BadgeExtractionError extends Error {
  readonly code: ExtractionErrorCode
  // NOT_PNG | NOT_SVG | NO_METADATA | INVALID_JSON
  // FETCH_CORS | FETCH_NOT_FOUND | FETCH_NETWORK | UNSUPPORTED_VERSION
}
```

---

## 5. PNG 解析の実装詳細 (`src/lib/extractors/png.ts`)

PNG チャンク構造:
```
[4B: 長さ] [4B: タイプ] [nB: データ] [4B: CRC]
```

iTXt チャンク構造:
```
keyword\0 | compressionFlag(1B) | compressionMethod(1B)
| languageTag\0 | translatedKeyword\0 | text(UTF-8)
```

- シグネチャ確認: `[137, 80, 78, 71, 13, 10, 26, 10]`
- `IEND` チャンクで走査終了
- キーワード `"openbadges"` または `"openbadgecredential"` の iTXt を対象
- compression flag = 1 は現在非対応（`NO_METADATA` エラー）
- 戻り値は `PngExtractionResult { text: string; warnings: ComplianceWarning[] }`
- テキスト先頭の null バイト（`0x00`）を検出した場合は除去しつつ `png.itxt.leading_null_byte` 警告を生成

テスト用 PNG 生成（`src/lib/__tests__/png-helper.ts`）:
- CRC32 テーブルを自前実装
- IHDR + iTXt + IDAT + IEND の最小構成で生成

---

## 6. ARIA アクセシビリティ実装

### DetailTabs

```
role="tablist" aria-label="バッジ詳細"
  role="tab" id="tab-{id}" aria-controls="tabpanel-{id}"
             aria-selected tabIndex={active ? 0 : -1}
  role="tabpanel" id="tabpanel-{id}" aria-labelledby="tab-{id}"
```

キーボード操作:
- `ArrowRight` / `ArrowLeft`: タブ切り替え（ループ）
- `Home` / `End`: 最初・最後のタブへ

### その他

- `BadgeInput`: loading 中 `aria-disabled` + `tabIndex={-1}`
- `App`: `aria-live="polite"` で結果エリアを動的更新通知
- ローディング: `role="status"` + `aria-label="読み込み中"`

---

## 7. テスト設計

| ファイル | テスト数 | カバー範囲 |
|---------|---------|-----------|
| `detect.test.ts` | 17 | v2/v3/unknown 判定、verification・openbadges/v2 コンテキスト対応、parseJson エラー |
| `v2.test.ts` | 22 | NormalizedBadgeV2 の各フィールド、verification エイリアス、必須フィールド警告、verify.type 警告 |
| `v3.test.ts` | 19 | NormalizedBadgeV3 の各フィールド、必須フィールド警告、validFrom 代替・欠落警告、tag 単数形警告 |
| `svg.test.ts` | 7 | id あり・なし、空コンテンツ、壊れた XML |
| `png.test.ts` | 7 | 正常抽出・warnings 空確認・null バイト警告・Unicode・大容量 JSON・シグネチャ不正・メタなし |
| `url.test.ts` | 5 | 200・404・500・CORS・NetworkError |
| `resolver.test.ts` | 13 | v2/v3 リゾルブ・失敗握り潰し・urn: スキップ・fetch 0 回確認 |

fetch モック: `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(...))`

---

## 8. バージョン判定ロジック (`src/lib/parsers/detect.ts`)

優先順位順:

1. `proof` フィールドあり → **v3.0**
2. `type[]` に `"VerifiableCredential"` → **v3.0**
3. `@context[]` に `w3.org/ns/credentials` または `w3id.org/badges/v3` → **v3.0**
4. `verify` または `verification` フィールドあり → **v2.0**
5. `@context` に `w3id.org/badges/v2` または `w3id.org/openbadges/v2` → **v2.0**（文字列・配列両対応）
6. 上記いずれにも該当しない → **unknown**（v2.0 としてフォールバック、`version.unknown` 警告）

---

## 9. 仕様準拠チェック一覧

バッジ解析のパイプライン全体で `ComplianceWarning` を収集する。
警告があっても表示を中断せず、UI で黄色いパネルとして表示する。

| コード | 検出フェーズ | 検出条件 |
|---|---|---|
| `png.itxt.leading_null_byte` | PNG 抽出 | iTXt テキストの先頭バイトが `0x00` |
| `v2.badge.missing` | v2 パース | `badge` フィールドが null/undefined |
| `v2.recipient.missing` | v2 パース | `recipient` フィールドが null/undefined |
| `v2.issuedOn.missing` | v2 パース | `issuedOn` フィールドが null/undefined |
| `v2.verify.missing` | v2 パース | `verify` も `verification` も存在しない |
| `v2.verify.field_name` | v2 パース | `verify` が null で `verification` が存在する |
| `v2.verify.type_invalid` | v2 パース | `verify.type` が `"hosted"` / `"signed"` 以外 |
| `v3.issuer.missing` | v3 パース | `issuer` フィールドが null/undefined |
| `v3.credentialSubject.missing` | v3 パース | `credentialSubject` フィールドが null/undefined |
| `v3.validFrom.missing` | v3 パース | `validFrom` も `awardedDate` も存在しない |
| `v3.validFrom.non_standard` | v3 パース | `validFrom` が null で `awardedDate` が存在する |
| `v3.achievement.tag_field_name` | v3 パース | `achievement.tags` が null で `achievement.tag` が存在する |
| `version.unknown` | 統合処理 | バージョン自動判定失敗（v2 フォールバック時） |

---

## 11. TypeScript 設定の注意点

- `tsconfig.app.json` に `"erasableSyntaxOnly": true` あり
  → コンストラクタの `public readonly` 引数不可
  → `BadgeExtractionError` は `this.code = code` 形式で実装
- Vitest の設定は `vitest/config` から `defineConfig` を使う
  （`vite` の `defineConfig` では `test` フィールドが型エラーになる）
