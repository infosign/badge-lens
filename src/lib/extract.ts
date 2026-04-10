import { BadgeExtractionError, type NormalizedBadge, type ComplianceWarning } from '../types/badges'
import { extractFromPng } from './extractors/png'
import { extractFromSvg } from './extractors/svg'
import { fetchFromUrl } from './extractors/url'
import { detectVersion, parseJson } from './parsers/detect'
import { normalizeV2 } from './parsers/v2'
import { normalizeV3 } from './parsers/v3'
import { resolveReferences } from './resolver'

/**
 * ファイル（PNG / SVG）からバッジメタデータを抽出・正規化・リゾルブする。
 */
export async function extractFromFile(file: File): Promise<NormalizedBadge> {
  const type = file.type
  const name = file.name.toLowerCase()

  let jsonStr: string
  let extractionWarnings: ComplianceWarning[] = []

  if (type === 'image/png' || name.endsWith('.png')) {
    const result = await extractFromPng(file)
    jsonStr = result.text
    extractionWarnings = result.warnings
  } else if (
    type === 'image/svg+xml' ||
    type === 'text/xml' ||
    name.endsWith('.svg')
  ) {
    jsonStr = await extractFromSvg(file)
  } else {
    throw new BadgeExtractionError(
      'PNG または SVG ファイルをアップロードしてください',
      'NOT_PNG',
    )
  }

  return normalizeAndResolve(jsonStr, extractionWarnings)
}

/**
 * URL からバッジメタデータを取得・正規化・リゾルブする。
 */
export async function extractFromUrl(url: string): Promise<NormalizedBadge> {
  const jsonStr = await fetchFromUrl(url)
  return normalizeAndResolve(jsonStr)
}

async function normalizeAndResolve(
  jsonStr: string,
  extractionWarnings: ComplianceWarning[] = [],
): Promise<NormalizedBadge> {
  const parsed = parseJson(jsonStr)
  const version = detectVersion(parsed)

  let badge: NormalizedBadge

  if (version === 'v2.0') {
    badge = normalizeV2(parsed)
  } else if (version === 'v3.0') {
    badge = normalizeV3(parsed)
  } else {
    // unknown: v2 として試みる
    try {
      badge = normalizeV2(parsed)
    } catch {
      throw new BadgeExtractionError(
        'Open Badges として認識できないメタデータです',
        'UNSUPPORTED_VERSION',
      )
    }
    badge.warnings.unshift({ code: 'version.unknown' })
  }

  // 抽出フェーズ（PNG 等）での警告を先頭に追加
  badge.warnings.unshift(...extractionWarnings)

  // 外部 URL 参照をリゾルブ（失敗しても握り潰す）
  return resolveReferences(badge)
}
