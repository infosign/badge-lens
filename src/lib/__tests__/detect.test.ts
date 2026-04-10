import { describe, it, expect } from 'vitest'
import { detectVersion, parseJson } from '../parsers/detect'
import { BadgeExtractionError } from '../../types/badges'

describe('detectVersion', () => {
  it('proof フィールドがあれば v3.0 と判定する', () => {
    expect(detectVersion({ proof: { type: 'DataIntegrityProof' } })).toBe('v3.0')
  })

  it('type[] に VerifiableCredential が含まれれば v3.0', () => {
    expect(detectVersion({ type: ['VerifiableCredential', 'OpenBadgeCredential'] })).toBe('v3.0')
  })

  it('@context[] に W3C VC URL が含まれれば v3.0', () => {
    expect(
      detectVersion({ '@context': ['https://www.w3.org/ns/credentials/v2', 'https://w3id.org/badges/v3'] }),
    ).toBe('v3.0')
  })

  it('@context[] に w3id.org/badges/v3 が含まれれば v3.0', () => {
    expect(
      detectVersion({ '@context': ['https://w3id.org/badges/v3'] }),
    ).toBe('v3.0')
  })

  it('verify フィールドがあれば v2.0', () => {
    expect(detectVersion({ verify: { type: 'hosted', url: 'https://example.com' } })).toBe('v2.0')
  })

  it('verification フィールド（非標準エイリアス）でも v2.0 と判定する', () => {
    expect(detectVersion({ verification: { type: 'HostedBadge' } })).toBe('v2.0')
  })

  it('@context が v2 URL 文字列なら v2.0', () => {
    expect(detectVersion({ '@context': 'https://w3id.org/badges/v2' })).toBe('v2.0')
  })

  it('@context が openbadges/v2 URL 文字列なら v2.0', () => {
    expect(detectVersion({ '@context': 'https://w3id.org/openbadges/v2' })).toBe('v2.0')
  })

  it('@context[] に v2 URL が含まれれば v2.0', () => {
    expect(detectVersion({ '@context': ['https://w3id.org/badges/v2'] })).toBe('v2.0')
  })

  it('手がかりがなければ unknown', () => {
    expect(detectVersion({ name: 'Badge' })).toBe('unknown')
  })

  it('null は unknown', () => {
    expect(detectVersion(null)).toBe('unknown')
  })

  it('文字列は unknown', () => {
    expect(detectVersion('string')).toBe('unknown')
  })

  it('proof は verify より優先（v3.0 が勝つ）', () => {
    expect(
      detectVersion({ proof: {}, verify: { type: 'hosted' } }),
    ).toBe('v3.0')
  })
})

describe('parseJson', () => {
  it('有効な JSON オブジェクトを返す', () => {
    const result = parseJson('{"key":"value"}')
    expect(result).toEqual({ key: 'value' })
  })

  it('無効な JSON は BadgeExtractionError(INVALID_JSON) を投げる', () => {
    expect(() => parseJson('not json')).toThrowError(BadgeExtractionError)
    try {
      parseJson('not json')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('INVALID_JSON')
    }
  })

  it('JSON が配列の場合も INVALID_JSON を投げる', () => {
    expect(() => parseJson('[1,2,3]')).toThrowError(BadgeExtractionError)
  })

  it('JSON が null の場合も INVALID_JSON を投げる', () => {
    expect(() => parseJson('null')).toThrowError(BadgeExtractionError)
  })
})
