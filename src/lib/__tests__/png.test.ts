import { describe, it, expect } from 'vitest'
import { extractFromPng } from '../extractors/png'
import { BadgeExtractionError } from '../../types/badges'
import { buildBakedPng, buildPlainPng, toFile } from './png-helper'

const ASSERTION_JSON = JSON.stringify({
  '@context': 'https://w3id.org/badges/v2',
  type: 'Assertion',
  id: 'https://example.com/assertions/1',
})

describe('extractFromPng', () => {
  it('openbadges iTXt チャンクから JSON を抽出する', async () => {
    const buffer = buildBakedPng(ASSERTION_JSON)
    const file = toFile(buffer, 'badge.png', 'image/png')
    const { text } = await extractFromPng(file)
    expect(JSON.parse(text)).toEqual(JSON.parse(ASSERTION_JSON))
  })

  it('正常なバッジは warnings が空', async () => {
    const buffer = buildBakedPng(ASSERTION_JSON)
    const file = toFile(buffer, 'badge.png', 'image/png')
    const { warnings } = await extractFromPng(file)
    expect(warnings).toEqual([])
  })

  it('iTXt チャンクがない PNG は NO_METADATA エラー', async () => {
    const buffer = buildPlainPng()
    const file = toFile(buffer, 'plain.png', 'image/png')
    await expect(extractFromPng(file)).rejects.toThrowError(BadgeExtractionError)
    try {
      await extractFromPng(file)
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('NO_METADATA')
    }
  })

  it('PNG シグネチャが無効なら NOT_PNG エラー', async () => {
    const buf = new ArrayBuffer(20)
    new Uint8Array(buf).fill(0)
    const file = toFile(buf, 'bad.png', 'image/png')
    await expect(extractFromPng(file)).rejects.toThrowError(BadgeExtractionError)
    try {
      await extractFromPng(file)
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('NOT_PNG')
    }
  })

  it('テキスト先頭に null バイトがある場合は warnings に png.itxt.leading_null_byte が含まれる', async () => {
    const buffer = buildBakedPng('\x00' + ASSERTION_JSON)
    const file = toFile(buffer, 'badge.png', 'image/png')
    const { text, warnings } = await extractFromPng(file)
    expect(JSON.parse(text)).toEqual(JSON.parse(ASSERTION_JSON))
    expect(warnings.some((w) => w.code === 'png.itxt.leading_null_byte')).toBe(true)
  })

  it('Unicode を含む JSON も正しく抽出できる', async () => {
    const json = JSON.stringify({ name: '日本語バッジ', '@context': 'https://w3id.org/badges/v2' })
    const buffer = buildBakedPng(json)
    const file = toFile(buffer, 'badge.png', 'image/png')
    const { text } = await extractFromPng(file)
    expect(JSON.parse(text).name).toBe('日本語バッジ')
  })

  it('大きな JSON も正しく抽出できる', async () => {
    const json = JSON.stringify({
      '@context': 'https://w3id.org/badges/v2',
      type: 'Assertion',
      description: 'x'.repeat(5000),
    })
    const buffer = buildBakedPng(json)
    const file = toFile(buffer, 'big.png', 'image/png')
    const { text } = await extractFromPng(file)
    expect(JSON.parse(text).description).toHaveLength(5000)
  })
})
