# Open Badges 仕様リファレンス（詳細版）

実装・調査で得た知見を含む手元リファレンス。  
最終更新: 2026-04-10

---

## 目次

1. [バージョン概要](#1-バージョン概要)
2. [バージョン判定ロジック](#2-バージョン判定ロジック)
3. [PNG ベイキング仕様](#3-png-ベイキング仕様)
4. [SVG ベイキング仕様](#4-svg-ベイキング仕様)
5. [Open Badges v2.0 データ構造](#5-open-badges-v20-データ構造)
6. [Open Badges v3.0 データ構造](#6-open-badges-v30-データ構造)
7. [実装ごとの差異・方言](#7-実装ごとの差異方言)
8. [参照 URL](#8-参照-url)

---

## 1. バージョン概要

| 項目 | v2.0 | v3.0 |
|------|------|------|
| 策定 | IMS Global (現 1EdTech) | 1EdTech |
| 公開 | 2018 | 2022〜2023 |
| 基盤モデル | 独自 JSON-LD | W3C Verifiable Credentials Data Model v2.0 |
| 最上位オブジェクト | `Assertion` | `OpenBadgeCredential` / `AchievementCredential` |
| 検証方式 | hosted（URL） / signed（JWS） | DataIntegrityProof / VC-JWT（Compact JWS） |
| PNG baking キーワード | `openbadges` | `openbadgecredential` |
| SVG baking タグ | `<script id="openbadges">` | `<script id="openbadges">` （同じ） |
| 受領者識別 | `recipient.identity`（email等）| `credentialSubject.id` または `credentialSubject.identifier[]` |

---

## 2. バージョン判定ロジック

JSON を受け取ってバージョンを判定する優先順位。

```
1. "proof" フィールドが存在する              → v3.0
2. type[] に "VerifiableCredential" が含まれる → v3.0
3. @context[] に以下の URL が含まれる         → v3.0
     "https://www.w3.org/ns/credentials/v2"
     "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
     "w3id.org/badges/v3"（任意のパス）
4. "verify" フィールドが存在する             → v2.0
5. @context が "https://w3id.org/badges/v2" の文字列 → v2.0
6. @context[] に "w3id.org/badges/v2" が含まれる    → v2.0
7. 上記いずれにも該当しない                 → unknown
```

**注意:** `proof` と `verify` が両方あれば v3.0 が優先（実際には起こらないが念のため）。

---

## 3. PNG ベイキング仕様

### 3.1 PNG チャンク構造（基礎）

```
┌──────────┬──────────┬──────────────┬──────────┐
│ 長さ (4B) │ タイプ (4B) │ データ (nB)   │ CRC (4B) │
└──────────┴──────────┴──────────────┴──────────┘
```

- **バイトオーダー:** ビッグエンディアン
- **CRC:** チャンクタイプ + データ部に対して CRC-32
- チャンクは `IEND` で終端

### 3.2 iTXt チャンク構造（詳細）

チャンクタイプ: `69 54 58 74`（ASCII: `iTXt`）

```
┌─────────────────────────────────┐
│ keyword (可変長 UTF-8)           │
│ \0 (null ターミネータ)            │
│ compression flag (1B)  0=なし    │
│ compression method (1B) 0=zlib   │
│ language tag (可変長 ASCII)      │ ← Open Badges では空（0B）
│ \0 (null ターミネータ)            │
│ translated keyword (可変長 UTF-8)│ ← Open Badges では空（0B）
│ \0 (null ターミネータ)            │
│ text (UTF-8 文字列)              │ ← ここに JSON または JWS
└─────────────────────────────────┘
```

**Open Badges の規定:**
- compression flag は `0`（圧縮禁止）
- language tag・translated keyword は空
- text には JSON（embedded proof）または Compact JWS（VC-JWT）を格納

### 3.3 バージョン別キーワード

| バージョン | iTXt キーワード | 備考 |
|-----------|----------------|------|
| v2.0 | `openbadges` | 小文字固定 |
| v3.0 | `openbadgecredential` | 小文字固定。v2 とは別のキーワード |

> **よくある誤解:** v3.0 でも `openbadges` キーワードを使うと思われがちだが、  
> 1EdTech 仕様は明確に `openbadgecredential` を規定している。

### 3.4 text フィールドの内容

| proof 方式 | text の内容 |
|-----------|-----------|
| Embedded Proof（DataIntegrityProof） | OpenBadgeCredential の JSON 文字列 |
| VC-JWT | Compact JWS（`header.payload.signature` 形式） |

### 3.5 解析アルゴリズム（擬似コード）

```
function extractFromPng(buffer):
  verify PNG signature [137,80,78,71,13,10,26,10]
  offset = 8
  while offset < buffer.length:
    length = readUint32BE(offset)
    type   = readAscii(offset+4, 4)
    if type == "iTXt":
      data = buffer[offset+8 .. offset+8+length]
      result = parseITXt(data)
      if result != null:
        return result
    if type == "IEND": break
    offset += 12 + length
  throw NO_METADATA

function parseITXt(data):
  i = 0
  kwEnd = data.indexOf(0x00, i)
  keyword = decode(data[0..kwEnd])
  if keyword not in {"openbadges", "openbadgecredential"}: return null
  i = kwEnd + 1
  compressionFlag = data[i++]
  compressionMethod = data[i++]          // 通常 0（未使用）
  langEnd = data.indexOf(0x00, i)
  i = langEnd + 1                        // language tag をスキップ
  tkwEnd = data.indexOf(0x00, i)
  i = tkwEnd + 1                         // translated keyword をスキップ
  textBytes = data[i..]
  if compressionFlag == 1: textBytes = zlibDecompress(textBytes)
  text = utf8Decode(textBytes)
  text = text.trimStart('\0').trim()     // ★ 先頭 null バイト除去（後述）
  return text
```

---

## 4. SVG ベイキング仕様

### 4.1 埋め込み形式

```xml
<svg xmlns="http://www.w3.org/2000/svg" ...>
  <!-- バッジの視覚コンテンツ -->

  <script id="openbadges" type="application/ld+json">
  { ... JSON or JWS ... }
  </script>
</svg>
```

- **v2.0 / v3.0 ともに同じ形式**（キーワードの変更なし）
- `id="openbadges"` と `type="application/ld+json"` の両方が望ましい
- id がない場合でも `type="application/ld+json"` だけで fallback 検索する実装が多い

### 4.2 解析アルゴリズム

```
function extractFromSvg(text):
  doc = DOMParser.parseFromString(text, "image/svg+xml")
  if doc contains <parsererror>: throw NOT_SVG

  script = doc.querySelector('script#openbadges[type="application/ld+json"]')
          ?? doc.querySelector('script[type="application/ld+json"]')  // fallback

  content = script?.textContent?.trim()
  if not content: throw NO_METADATA
  return content
```

---

## 5. Open Badges v2.0 データ構造

### 5.1 Assertion（必須フィールド）

```jsonc
{
  "@context": "https://w3id.org/badges/v2",
  "type": "Assertion",
  "id": "https://example.com/assertions/123",      // 検証可能な URL
  "badge": "https://example.com/badges/abc",       // BadgeClass URL or オブジェクト
  "recipient": {
    "type": "email",
    "hashed": true,
    "salt": "deadsea",
    "identity": "sha256$c7ef..."                    // ハッシュ済みメールアドレス等
  },
  "issuedOn": "2024-01-01T00:00:00Z",
  "verify": {
    "type": "hosted",                              // or "signed"
    "url": "https://example.com/assertions/123"
  }
}
```

### 5.2 Assertion（オプションフィールド）

```jsonc
{
  "image": "https://example.com/assertions/123/image",
  "expires": "2025-01-01T00:00:00Z",
  "evidence": [
    { "id": "https://...", "narrative": "..." }
  ],
  "narrative": "テキストによる説明",
  "revoked": false,
  "revocationReason": "..."
}
```

### 5.3 BadgeClass

```jsonc
{
  "@context": "https://w3id.org/badges/v2",
  "type": "BadgeClass",
  "id": "https://example.com/badges/abc",
  "name": "バッジ名",
  "description": "説明",
  "image": "https://example.com/badge.png",
  "criteria": {
    "id": "https://example.com/criteria",          // URL でも可
    "narrative": "取得条件のテキスト"
  },
  "issuer": "https://example.com/issuer",          // URL or Issuer オブジェクト
  "alignment": [
    { "targetName": "...", "targetUrl": "...", "targetCode": "..." }
  ],
  "tags": ["tag1", "tag2"]
}
```

### 5.4 Issuer / Profile

```jsonc
{
  "@context": "https://w3id.org/badges/v2",
  "type": "Issuer",                               // or "Profile"
  "id": "https://example.com/issuer",
  "name": "発行組織名",
  "url": "https://example.com",
  "email": "contact@example.com",
  "image": "https://example.com/logo.png",
  "description": "組織の説明",
  "revocationList": "https://example.com/revocation"
}
```

### 5.5 verify タイプ別の挙動

| type | 意味 | verify.url の意味 |
|------|------|-----------------|
| `hosted` | アサーション URL にアクセスして検証 | アサーション自身の URL |
| `signed` | JWS 署名を検証 | 公開鍵（JWK）の URL |

---

## 6. Open Badges v3.0 データ構造

### 6.1 OpenBadgeCredential（必須フィールド）

```jsonc
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "id": "urn:uuid:12345678-...",
  "issuer": {
    "id": "did:key:z6Mk...",                       // DID or HTTPS URL
    "type": ["Profile"],
    "name": "発行者名"
  },
  "validFrom": "2024-01-01T00:00:00Z",             // issuedOn 相当
  "credentialSubject": {
    "type": ["AchievementSubject"],
    "achievement": { ... }                         // Achievement オブジェクト
  }
}
```

### 6.2 OpenBadgeCredential（オプションフィールド）

```jsonc
{
  "name": "バッジ名",
  "description": "説明",
  "image": { "id": "https://...", "type": "Image" },
  "validUntil": "2025-12-31T23:59:59Z",
  "credentialStatus": {
    "id": "https://example.com/status#123",
    "type": "1EdTechRevocationList"               // or "StatusList2021Entry"
  },
  "evidence": [{ "id": "https://...", "type": ["Evidence"] }],
  "awardedDate": "2024-01-01T00:00:00Z",          // 一部実装が使用
  "endorsement": [ ... ]
}
```

### 6.3 Achievement（達成バッジの定義）

```jsonc
{
  "id": "https://example.com/achievements/abc",
  "type": ["Achievement"],
  "name": "バッジ名",
  "description": "説明",
  "image": { "id": "https://...", "type": "Image" },
  "criteria": { "narrative": "取得条件" },
  "alignment": [ ... ],
  "tags": ["tag1"],                               // または "tag": ["tag1"]（後述）
  "achievementType": "Certificate",
  "fieldOfStudy": "...",
  "specialization": "...",
  "inLanguage": "ja"
}
```

### 6.4 credentialSubject の受領者識別

v3.0 では受領者の識別方法が 2 種類ある:

```jsonc
// パターン A: id フィールド（DID や URL）
"credentialSubject": {
  "id": "did:example:recipient",
  "type": ["AchievementSubject"]
}

// パターン B: identifier 配列（プライバシー保護のためハッシュ化）
"credentialSubject": {
  "type": ["AchievementSubject"],
  "identifier": [
    {
      "type": "IdentityObject",
      "identityHash": "sha256$a489...",
      "identityType": "emailAddress",
      "hashed": true,
      "salt": "zQu1m0Kt06"
    }
  ]
}
```

`id` がない場合は `identifier[0].identityHash` を受領者識別子として扱う。

### 6.5 Proof（署名）

```jsonc
// DataIntegrityProof（Embedded Proof）
"proof": {
  "type": "DataIntegrityProof",
  "cryptosuite": "eddsa-rdfc-2022",              // or "ecdsa-rdfc-2019"
  "proofPurpose": "assertionMethod",
  "verificationMethod": "did:key:z6Mk...#z6Mk...",
  "created": "2024-01-01T12:00:00Z",
  "proofValue": "z2pwa..."                        // base58btc エンコード
}
```

| cryptosuite | 鍵タイプ | 用途 |
|-------------|---------|------|
| `eddsa-rdfc-2022` | Ed25519（OKP） | 主流 |
| `ecdsa-rdfc-2019` | P-256 / P-384 | 代替 |

### 6.6 Issuer の DID 表現

v3.0 では issuer.id に DID（Decentralized Identifier）が使われることが多い:

```
did:key:z6MkjvM4uKQGs16bW2pat5ab39R6Dd857Pu1Wkcet349XdRF
```

- `did:key:` は公開鍵から自己完結的に生成される DID
- リゾルブ不要（鍵情報が DID 文字列に内包される）
- `http://` / `https://` URL を使う実装もある

---

## 7. 実装ごとの差異・方言

実際のバッジを解析して判明した、仕様と異なる実装上の振る舞いをまとめる。

### 7.1 Open Badge Factory（openbadgefactory.com）

| 項目 | 仕様 | OBF の実装 | 評価 |
|------|------|-----------|------|
| PNG baking キーワード | `openbadgecredential` | `openbadgecredential` | **準拠** |
| text フィールド先頭 | JSON / JWS 文字列 | `\0` + JSON（null バイトあり） | **非準拠（バグ）** |
| `achievement.tags` フィールド名 | `tags` | `tag`（単数形） | **非準拠（方言）** |
| `credentialSubject.id` | DID / URL | なし。`identifier[]` を使用 | **準拠**（仕様で許容） |
| `awardedDate` フィールド | 非標準 | あり | **拡張フィールド**（無害） |
| `@context` | `https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json` | 同上 + `extensions.json` も追加 | **準拠** |

**既知バグ詳細 — 先頭 null バイト:**

```
期待:  7b 22 61 77 61 72 64 65 64 ...  → {"awarded...
実際:  00 7b 22 61 77 61 72 64 65 ...  → \0{"awarded...
```

OBF が baking コードの書き込みロジックで translated keyword の null ターミネータを  
text フィールドの先頭に誤って 1 バイト余分に書いていると推測される。  
→ バグレポート送付済み（`docs/obf-bug-report.md`）

**対処コード:**
```typescript
const text = rawText.replace(/^\0+/, '').trim()
```

### 7.2 フィールド名の単数・複数揺れ

複数の実装で確認された `tags` vs `tag` 問題:

```jsonc
// 仕様（OB v3.0）
"tags": ["tag1", "tag2"]

// Open Badge Factory の実装
"tag": ["tag1", "tag2"]
```

パーサーでは両方にフォールバックする必要がある:
```typescript
tags: achievement?.tags ?? achievement?.tag
```

### 7.3 image フィールドの表現揺れ

v3.0 では `image` は `Image` オブジェクトか文字列 URL のどちらでも可:

```jsonc
// オブジェクト形式
"image": { "id": "https://example.com/badge.png", "type": "Image" }

// 文字列形式（v2.0 スタイルとの互換）
"image": "https://example.com/badge.png"
```

取り出し時は両方に対応:
```typescript
function resolveImage(image: string | V3Image | undefined): string | undefined {
  if (typeof image === 'string') return image
  return image?.id
}
```

### 7.4 @context の URL 揺れ（v3.0）

実装によって `@context` に含まれる URL が異なる:

```jsonc
// 1EdTech 公式（最新）
"https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"

// 古いバージョン
"https://purl.imsglobal.org/spec/ob/v3p0/context.json"

// W3ID 経由
"https://w3id.org/badges/v3"
```

バージョン判定では URL の部分一致（`w3id.org/badges/v3`、`w3.org/ns/credentials` を含む）で判定するのが安全。

---

## 8. 参照 URL

| ドキュメント | URL |
|------------|-----|
| Open Badges v2.0 仕様 | https://www.imsglobal.org/spec/ob/v2p0/ |
| Open Badges v2.0 Baking 仕様 | https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/baking/index.html |
| Open Badges v3.0 仕様 | https://www.imsglobal.org/spec/ob/v3p0/ |
| Open Badges v3.0 Context 3.0.3 | https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json |
| 1EdTech GitHub（仕様リポジトリ） | https://github.com/1EdTech/openbadges-specification |
| W3C Verifiable Credentials v2 | https://www.w3.org/TR/vc-data-model-2.0/ |
| W3C PNG 仕様（iTXt §11.3.4） | https://www.w3.org/TR/png-3/#11iTXt |
| CRC-32 アルゴリズム | https://www.w3.org/TR/png-3/#crc-algorithm |
