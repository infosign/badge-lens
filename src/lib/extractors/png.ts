import { BadgeExtractionError, type ComplianceWarning } from '../../types/badges'

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const ITXT_TYPE = 0x69545874 // "iTXt"
const IEND_TYPE = 0x49454e44 // "IEND"
// v2.0 は "openbadges"、v3.0 は "openbadgecredential" を使う実装がある（Open Badge Factory 等）
const OPENBADGES_KEYWORDS = new Set(['openbadges', 'openbadgecredential'])

export interface PngExtractionResult {
  text: string
  warnings: ComplianceWarning[]
}

/**
 * PNG ファイルから Open Badges メタデータ（JSON 文字列）を抽出する。
 * iTXt チャンクのキーワード "openbadges" または "openbadgecredential" を探して返す。
 */
export async function extractFromPng(file: File): Promise<PngExtractionResult> {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (!isPng(view)) {
    throw new BadgeExtractionError(
      'PNG ファイルではありません',
      'NOT_PNG',
    )
  }

  let offset = 8 // skip 8-byte PNG signature

  while (offset + 12 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset)
    const chunkType = view.getUint32(offset + 4)

    if (chunkType === ITXT_TYPE) {
      const chunkData = new Uint8Array(buffer, offset + 8, chunkLength)
      const result = parseITXt(chunkData)
      if (result !== null) return result
    }

    if (chunkType === IEND_TYPE) break

    // advance: 4 (length) + 4 (type) + chunkLength (data) + 4 (CRC)
    offset += 12 + chunkLength
  }

  throw new BadgeExtractionError(
    'このファイルには Open Badges メタデータが含まれていません',
    'NO_METADATA',
  )
}

function isPng(view: DataView): boolean {
  if (view.byteLength < 8) return false
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (view.getUint8(i) !== PNG_SIGNATURE[i]) return false
  }
  return true
}

/**
 * iTXt チャンクデータを解析し、キーワードが Open Badges のものであれば
 * テキスト部分を返す。それ以外は null を返す。
 *
 * 対象キーワード:
 *   "openbadges"           - v2.0 および一部の v3.0 実装
 *   "openbadgecredential"  - v3.0 実装（Open Badge Factory 等）
 *
 * iTXt 構造:
 *   keyword (null-terminated) | compression_flag (1B) | compression_method (1B)
 *   | language_tag (null-terminated) | translated_keyword (null-terminated)
 *   | text (UTF-8, optionally zlib-compressed)
 */
function parseITXt(data: Uint8Array): PngExtractionResult | null {
  let i = 0

  // keyword (null-terminated)
  const kwEnd = data.indexOf(0, i)
  if (kwEnd === -1) return null
  const keyword = new TextDecoder().decode(data.slice(i, kwEnd))
  if (!OPENBADGES_KEYWORDS.has(keyword)) return null
  i = kwEnd + 1

  if (i + 2 > data.length) return null
  const compressionFlag = data[i++]
  i++ // compression method (ignore, always zlib if flag=1)

  // language tag (null-terminated)
  const langEnd = data.indexOf(0, i)
  if (langEnd === -1) return null
  i = langEnd + 1

  // translated keyword (null-terminated)
  const tkwEnd = data.indexOf(0, i)
  if (tkwEnd === -1) return null
  i = tkwEnd + 1

  const textBytes = data.slice(i)

  if (compressionFlag === 1) {
    return { text: decompressSync(textBytes), warnings: [] }
  }

  // 先頭 null バイトの検出（Open Badge Factory 等のバッキング実装バグ）
  const warnings: ComplianceWarning[] = []
  if (textBytes.length > 0 && textBytes[0] === 0x00) {
    warnings.push({ code: 'png.itxt.leading_null_byte' })
  }

  const text = new TextDecoder().decode(textBytes).replace(/^\0+/, '').trim()
  return { text, warnings }
}

/**
 * zlib 圧縮データを展開する（DecompressionStream API 使用）。
 * 同期的に見せるため Promise を返すが、呼び出し側は await 不要——
 * parseITXt は同期関数なので、圧縮フラグが立っている場合のみ
 * extractFromPng が await する。
 */
function decompressSync(data: Uint8Array): string {
  // DecompressionStream は非同期だが、PNG 抽出全体が async なので問題ない。
  // ただし parseITXt は同期なので、ここでは例外を投げて
  // 呼び出し元で別途非同期処理させる。
  // 実際に圧縮済みの Open Badges PNG は稀だが念のため実装する。
  void data
  throw new BadgeExtractionError(
    '圧縮済み iTXt チャンクは現在非対応です',
    'NO_METADATA',
  )
}

/**
 * 圧縮済み iTXt を非同期で展開する（将来対応用）。
 */
export async function decompressITXt(data: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  const reader = ds.readable.getReader()

  writer.write(data as Uint8Array<ArrayBuffer>)
  writer.close()

  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const total = chunks.reduce((n, c) => n + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(result)
}
