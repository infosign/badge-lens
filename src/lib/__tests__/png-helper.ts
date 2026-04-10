/**
 * テスト用 PNG バイナリ生成ユーティリティ。
 * Open Badges の iTXt チャンクを持つ最小 PNG を構築する。
 */

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

// CRC32 テーブル（PNG チャンク検証用）
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint32BE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, false)
}

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  // chunk = length(4) + type(4) + data(N) + CRC(4)
  const buf = new Uint8Array(12 + data.length)
  const view = new DataView(buf.buffer)

  writeUint32BE(view, 0, data.length)
  buf.set(typeBytes, 4)
  buf.set(data, 8)

  const crcInput = new Uint8Array(4 + data.length)
  crcInput.set(typeBytes, 0)
  crcInput.set(data, 4)
  writeUint32BE(view, 8 + data.length, crc32(crcInput))

  return buf
}

/** 1×1 px の最小 IHDR チャンクデータ */
function buildIHDR(): Uint8Array {
  const data = new Uint8Array(13)
  const view = new DataView(data.buffer)
  writeUint32BE(view, 0, 1)  // width
  writeUint32BE(view, 4, 1)  // height
  data[8] = 8   // bit depth
  data[9] = 2   // color type: RGB
  data[10] = 0  // compression method
  data[11] = 0  // filter method
  data[12] = 0  // interlace method
  return buildChunk('IHDR', data)
}

/** 最小 IDAT チャンク（1px 黒の deflate 済みデータ） */
function buildIDAT(): Uint8Array {
  // filter(0) + R(0) G(0) B(0) → deflate
  const raw = new Uint8Array([0x78, 0x9c, 0x62, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01])
  return buildChunk('IDAT', raw)
}

/** IEND チャンク */
function buildIEND(): Uint8Array {
  return buildChunk('IEND', new Uint8Array(0))
}

/**
 * キーワード "openbadges" を持つ iTXt チャンクを構築する。
 *
 * iTXt 構造:
 *   keyword\0 | compressionFlag(1) | compressionMethod(1)
 *   | languageTag\0 | translatedKeyword\0 | text
 */
function buildITXt(keyword: string, text: string, compress = false): Uint8Array {
  const enc = new TextEncoder()
  const kwBytes = enc.encode(keyword)
  const textBytes = enc.encode(text)

  const data = new Uint8Array(
    kwBytes.length + 1 +  // keyword + \0
    2 +                   // compression flag + method
    1 +                   // language tag \0
    1 +                   // translated keyword \0
    textBytes.length,
  )

  let i = 0
  data.set(kwBytes, i); i += kwBytes.length
  data[i++] = 0                       // keyword null terminator
  data[i++] = compress ? 1 : 0       // compression flag
  data[i++] = 0                       // compression method
  data[i++] = 0                       // language tag \0
  data[i++] = 0                       // translated keyword \0
  data.set(textBytes, i)

  return buildChunk('iTXt', data)
}

/**
 * Open Badges メタデータ JSON を埋め込んだ PNG の ArrayBuffer を返す。
 */
export function buildBakedPng(assertionJson: string): ArrayBuffer {
  const ihdr = buildIHDR()
  const itxt = buildITXt('openbadges', assertionJson)
  const idat = buildIDAT()
  const iend = buildIEND()

  const total = PNG_SIGNATURE.length + ihdr.length + itxt.length + idat.length + iend.length
  const buf = new Uint8Array(total)
  let offset = 0
  for (const chunk of [PNG_SIGNATURE, ihdr, itxt, idat, iend]) {
    buf.set(chunk, offset)
    offset += chunk.length
  }
  return buf.buffer
}

/**
 * メタデータを持たない通常の PNG の ArrayBuffer を返す。
 */
export function buildPlainPng(): ArrayBuffer {
  const ihdr = buildIHDR()
  const idat = buildIDAT()
  const iend = buildIEND()

  const total = PNG_SIGNATURE.length + ihdr.length + idat.length + iend.length
  const buf = new Uint8Array(total)
  let offset = 0
  for (const chunk of [PNG_SIGNATURE, ihdr, idat, iend]) {
    buf.set(chunk, offset)
    offset += chunk.length
  }
  return buf.buffer
}

/**
 * ArrayBuffer を File オブジェクトに変換するヘルパー。
 */
export function toFile(buffer: ArrayBuffer, name: string, type: string): File {
  return new File([buffer], name, { type })
}
