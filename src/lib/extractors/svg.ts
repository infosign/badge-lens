import { BadgeExtractionError } from '../../types/badges'

/**
 * SVG ファイルから Open Badges メタデータ（JSON 文字列）を抽出する。
 * <script id="openbadges" type="application/ld+json"> タグの内容を返す。
 */
export async function extractFromSvg(file: File): Promise<string> {
  const text = await file.text()
  return extractFromSvgText(text)
}

/**
 * SVG テキストから Open Badges メタデータを抽出する（テスト用に分離）。
 */
export function extractFromSvgText(svgText: string): string {
  if (!svgText.trim().startsWith('<')) {
    throw new BadgeExtractionError('SVG ファイルではありません', 'NOT_SVG')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new BadgeExtractionError('SVG の解析に失敗しました', 'NOT_SVG')
  }

  // 優先順位: id="openbadges" かつ type="application/ld+json"
  const script =
    doc.querySelector('script#openbadges[type="application/ld+json"]') ??
    doc.querySelector('script[type="application/ld+json"]')

  const content = script?.textContent?.trim()
  if (!content) {
    throw new BadgeExtractionError(
      'このファイルには Open Badges メタデータが含まれていません',
      'NO_METADATA',
    )
  }

  return content
}
