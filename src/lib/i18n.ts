export type Locale = 'ja' | 'en'

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.startsWith('ja') ? 'ja' : 'en'
}

const ja = {
  // App
  'app.subtitle': 'v2.0 / v3.0 メタデータビューア',
  'app.loading': 'メタデータを取得中…',
  'app.retry': 'もう一度試す',
  'app.footer': 'バッジデータはすべてブラウザ内で処理されます。外部サーバーには送信されません。',
  'app.input.section': 'バッジ入力',

  // BadgeInput
  'input.dropzone.label': 'バッジ画像をアップロード',
  'input.dropzone.title': 'PNG / SVG をドラッグ＆ドロップ',
  'input.dropzone.hint': 'またはクリックして選択（最大 10 MB）',
  'input.divider': 'または',
  'input.url.label': 'アサーション URL',
  'input.url.placeholder': 'https://example.com/assertions/123',
  'input.submit.loading': '取得中…',
  'input.submit': '取得',

  // MetadataView
  'result.title': '抽出結果',
  'result.reset': '別のバッジを確認',
  'warnings.title': '仕様への非準拠が検出されました',
  'warnings.footer':
    'このバッジは Open Badges 仕様に完全には準拠していません。他のプラットフォームで取り込みに失敗する場合があります。',

  // SummaryPanel
  'summary.unnamed': '（名称なし）',
  'summary.issuer': '発行者',
  'summary.recipient': '受領者',
  'summary.issuedOn': '発行日',
  'summary.expires': '有効期限',
  'summary.criteria': '取得条件',
  'summary.narrative': 'ナラティブ',
  'summary.tags': 'タグ',

  // DetailTabs
  'tabs.label': 'バッジ詳細',
  'tabs.empty': 'データがありません',

  // ErrorMessage
  'error.title': 'エラー',
  'error.unknown': '予期しないエラーが発生しました。',

  // JsonViewer
  'json.copy': 'コピー',
  'json.copy.label': 'JSON をコピー',
  'json.copied': 'コピー完了!',

  // Error codes (BadgeExtractionError.code)
  'error.NOT_PNG': 'PNG ファイルではありません。',
  'error.NOT_SVG': 'SVG ファイルではありません。',
  'error.NO_METADATA': 'このファイルには Open Badges メタデータが含まれていません。',
  'error.INVALID_JSON': 'メタデータの JSON 解析に失敗しました。',
  'error.FETCH_CORS': '外部 URL へのアクセスが CORS ポリシーにより拒否されました。',
  'error.FETCH_NOT_FOUND': '指定された URL にバッジが見つかりませんでした（404）。',
  'error.FETCH_NETWORK': 'ネットワークエラーが発生しました。接続を確認してください。',
  'error.UNSUPPORTED_VERSION': 'Open Badges として認識できないメタデータです。',

  // Compliance warning codes (ComplianceWarning.code)
  'warning.png.itxt.leading_null_byte':
    'PNG iTXt テキストフィールドの先頭に不正な null バイト (0x00) が含まれています（PNG 仕様違反）。バッジを発行したプラットフォームの実装バグと思われます。',
  'warning.v2.badge.missing':
    '"badge" フィールドがありません（必須）。バッジクラスの情報を取得できません。',
  'warning.v2.recipient.missing':
    '"recipient" フィールドがありません（必須）。受領者情報を取得できません。',
  'warning.v2.issuedOn.missing':
    '"issuedOn" フィールドがありません（必須）。発行日を取得できません。',
  'warning.v2.verify.missing':
    '"verify" フィールドがありません（必須）。検証情報がないため他のプラットフォームで拒否される可能性があります。',
  'warning.v2.verify.field_name':
    'フィールド名が "verify" ではなく "verification" です（Open Badges v2.0 仕様違反）。',
  'warning.v2.verify.type_invalid':
    'verify.type の値 "{{type}}" は非標準です（正しい値: "hosted" または "signed"）。',
  'warning.v3.issuer.missing':
    '"issuer" フィールドがありません（必須）。発行者情報を取得できません。',
  'warning.v3.credentialSubject.missing':
    '"credentialSubject" フィールドがありません（必須）。受領者・バッジ達成情報を取得できません。',
  'warning.v3.validFrom.missing':
    '"validFrom" フィールドがありません（必須）。発行日を取得できません。',
  'warning.v3.validFrom.non_standard':
    '"validFrom" の代わりに非標準の "awardedDate" が使われています（Open Badges v3.0 仕様では "validFrom" が必須）。',
  'warning.v3.achievement.tag_field_name':
    'achievement のフィールド名が "tags" ではなく "tag" です（Open Badges v3.0 仕様では "tags"）。',
  'warning.version.unknown':
    'Open Badges のバージョンを自動判定できませんでした。v2.0 として処理しています。',

  // URL health check warnings
  'warning.url.http_error':
    '{{field}} の URL にアクセスしたところ HTTP {{status}} が返されました: {{url}}',
  'warning.url.image_broken':
    '{{field}} の画像 URL を読み込めませんでした: {{url}}',
  'warning.url.network_error':
    '{{field}} の URL に到達できませんでした（ネットワークエラー）: {{url}}',
} satisfies Record<string, string>

const en: Record<string, string> = {
  // App
  'app.subtitle': 'v2.0 / v3.0 Metadata Viewer',
  'app.loading': 'Fetching metadata…',
  'app.retry': 'Try again',
  'app.footer':
    'All badge data is processed in your browser. Nothing is sent to external servers.',
  'app.input.section': 'Badge input',

  // BadgeInput
  'input.dropzone.label': 'Upload badge image',
  'input.dropzone.title': 'Drag & drop PNG / SVG',
  'input.dropzone.hint': 'or click to select (max 10 MB)',
  'input.divider': 'or',
  'input.url.label': 'Assertion URL',
  'input.url.placeholder': 'https://example.com/assertions/123',
  'input.submit.loading': 'Loading…',
  'input.submit': 'Fetch',

  // MetadataView
  'result.title': 'Extracted Result',
  'result.reset': 'Check another badge',
  'warnings.title': 'Specification non-compliance detected',
  'warnings.footer':
    'This badge does not fully comply with the Open Badges specification. It may fail to import on other platforms.',

  // SummaryPanel
  'summary.unnamed': '(No name)',
  'summary.issuer': 'Issuer',
  'summary.recipient': 'Recipient',
  'summary.issuedOn': 'Issued on',
  'summary.expires': 'Expires',
  'summary.criteria': 'Criteria',
  'summary.narrative': 'Narrative',
  'summary.tags': 'Tags',

  // DetailTabs
  'tabs.label': 'Badge details',
  'tabs.empty': 'No data',

  // ErrorMessage
  'error.title': 'Error',
  'error.unknown': 'An unexpected error occurred.',

  // JsonViewer
  'json.copy': 'Copy',
  'json.copy.label': 'Copy JSON',
  'json.copied': 'Copied!',

  // Error codes
  'error.NOT_PNG': 'This file is not a PNG.',
  'error.NOT_SVG': 'This file is not an SVG.',
  'error.NO_METADATA': 'This file does not contain Open Badges metadata.',
  'error.INVALID_JSON': 'Failed to parse the metadata as JSON.',
  'error.FETCH_CORS': 'Access to the external URL was blocked by CORS policy.',
  'error.FETCH_NOT_FOUND': 'No badge was found at the specified URL (404).',
  'error.FETCH_NETWORK': 'A network error occurred. Please check your connection.',
  'error.UNSUPPORTED_VERSION': 'The metadata could not be recognized as Open Badges.',

  // Compliance warning codes
  'warning.png.itxt.leading_null_byte':
    'The PNG iTXt text field starts with a spurious null byte (0x00), which violates the PNG specification. This is likely a bug in the badge-issuing platform.',
  'warning.v2.badge.missing':
    'The "badge" field is missing (required). Badge class information cannot be retrieved.',
  'warning.v2.recipient.missing':
    'The "recipient" field is missing (required). Recipient information cannot be retrieved.',
  'warning.v2.issuedOn.missing':
    'The "issuedOn" field is missing (required). Issue date cannot be retrieved.',
  'warning.v2.verify.missing':
    'The "verify" field is missing (required). Without verification info, this badge may be rejected by other platforms.',
  'warning.v2.verify.field_name':
    'The field is named "verification" instead of "verify" (violates the Open Badges v2.0 specification).',
  'warning.v2.verify.type_invalid':
    'verify.type value "{{type}}" is non-standard (expected: "hosted" or "signed").',
  'warning.v3.issuer.missing':
    'The "issuer" field is missing (required). Issuer information cannot be retrieved.',
  'warning.v3.credentialSubject.missing':
    'The "credentialSubject" field is missing (required). Recipient and achievement information cannot be retrieved.',
  'warning.v3.validFrom.missing':
    'The "validFrom" field is missing (required). Issue date cannot be retrieved.',
  'warning.v3.validFrom.non_standard':
    '"awardedDate" is used instead of "validFrom" (the Open Badges v3.0 specification requires "validFrom").',
  'warning.v3.achievement.tag_field_name':
    'The achievement field is named "tag" instead of "tags" (the Open Badges v3.0 specification uses "tags").',
  'warning.version.unknown':
    'Could not automatically detect the Open Badges version. Processing as v2.0.',

  // URL health check warnings
  'warning.url.http_error':
    '{{field}} returned HTTP {{status}}: {{url}}',
  'warning.url.image_broken':
    'Image URL for {{field}} failed to load: {{url}}',
  'warning.url.network_error':
    '{{field}} is unreachable (network error): {{url}}',
}

const dict: Record<Locale, Record<string, string>> = { ja, en }

/**
 * ロケールに対応した翻訳関数を生成する。
 * - キーが見つからない場合は fallback、それもなければキー自身を返す
 * - `{{key}}` プレースホルダーを params で置換する
 */
export function createT(locale: Locale) {
  const d = dict[locale]
  return function t(
    key: string,
    params?: Record<string, string>,
    fallback?: string,
  ): string {
    const raw = d[key] ?? fallback ?? key
    if (!params) return raw
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`)
  }
}
