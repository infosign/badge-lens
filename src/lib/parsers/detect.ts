import { BadgeExtractionError, type BadgeVersion } from '../../types/badges'

/**
 * JSON オブジェクトから Open Badges バージョンを判定する。
 *
 * 判定優先順位:
 *  1. proof フィールドあり → v3.0
 *  2. type[] に "VerifiableCredential" → v3.0
 *  3. @context[] に W3C VC URL → v3.0
 *  4. verify フィールドあり → v2.0
 *  5. @context が v2 URL → v2.0
 *  6. それ以外 → unknown
 */
export function detectVersion(json: unknown): BadgeVersion {
  if (typeof json !== 'object' || json === null) return 'unknown'
  const obj = json as Record<string, unknown>

  // v3.0 判定
  if ('proof' in obj) return 'v3.0'

  const type = obj['type']
  if (Array.isArray(type) && type.includes('VerifiableCredential')) return 'v3.0'

  const ctx = obj['@context']
  if (
    Array.isArray(ctx) &&
    ctx.some(
      (c) =>
        typeof c === 'string' &&
        (c.includes('w3.org/ns/credentials') || c.includes('w3id.org/badges/v3')),
    )
  )
    return 'v3.0'

  // v2.0 判定
  if ('verify' in obj || 'verification' in obj) return 'v2.0'

  if (
    typeof ctx === 'string' &&
    (ctx.includes('w3id.org/badges/v2') || ctx.includes('w3id.org/openbadges/v2'))
  )
    return 'v2.0'

  if (
    Array.isArray(ctx) &&
    ctx.some(
      (c) =>
        typeof c === 'string' &&
        (c.includes('w3id.org/badges/v2') || c.includes('w3id.org/openbadges/v2')),
    )
  )
    return 'v2.0'

  return 'unknown'
}

/**
 * JSON 文字列をパースしてバージョン検出まで行う。
 * パース失敗時は BadgeExtractionError を投げる。
 */
export function parseJson(jsonStr: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new BadgeExtractionError(
      'メタデータの JSON 解析に失敗しました',
      'INVALID_JSON',
    )
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new BadgeExtractionError(
      'メタデータが JSON オブジェクトではありません',
      'INVALID_JSON',
    )
  }

  return parsed as Record<string, unknown>
}
