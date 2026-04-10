import { describe, it, expect } from 'vitest'
import { normalizeV2 } from '../parsers/v2'

const INLINE_BADGE_CLASS = {
  id: 'https://example.com/badges/abc',
  type: 'BadgeClass',
  name: 'Test Badge',
  description: 'A test badge',
  image: 'https://example.com/badge.png',
  criteria: { narrative: 'Do something great' },
  issuer: {
    id: 'https://example.com/issuer',
    type: 'Issuer',
    name: 'Example Org',
    url: 'https://example.com',
    image: 'https://example.com/logo.png',
  },
  tags: ['test', 'example'],
}

const V2_ASSERTION = {
  '@context': 'https://w3id.org/badges/v2',
  type: 'Assertion',
  id: 'https://example.com/assertions/123',
  badge: INLINE_BADGE_CLASS,
  recipient: {
    type: 'email',
    hashed: true,
    salt: 'abc',
    identity: 'sha256$abcdef',
  },
  issuedOn: '2024-01-01T00:00:00Z',
  expires: '2025-01-01T00:00:00Z',
  verify: { type: 'hosted', url: 'https://example.com/assertions/123' },
  narrative: 'Well done!',
}

describe('normalizeV2', () => {
  it('version が v2.0 である', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.version).toBe('v2.0')
  })

  it('raw に元のアサーションが入っている', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.raw).toEqual(V2_ASSERTION)
  })

  it('badgeClass がインライン展開される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.badgeClass?.name).toBe('Test Badge')
  })

  it('issuer がインライン展開される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.issuer?.name).toBe('Example Org')
  })

  it('summary.name が BadgeClass.name から設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.name).toBe('Test Badge')
  })

  it('summary.description が BadgeClass.description から設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.description).toBe('A test badge')
  })

  it('summary.image が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.image).toBe('https://example.com/badge.png')
  })

  it('summary.recipientIdentity が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.recipientIdentity).toBe('sha256$abcdef')
  })

  it('summary.issuedOn が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.issuedOn).toBe('2024-01-01T00:00:00Z')
  })

  it('summary.expires が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.expires).toBe('2025-01-01T00:00:00Z')
  })

  it('summary.issuerName が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.issuerName).toBe('Example Org')
  })

  it('summary.issuerUrl が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.issuerUrl).toBe('https://example.com')
  })

  it('summary.criteria が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.criteria).toBe('Do something great')
  })

  it('summary.tags が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.tags).toEqual(['test', 'example'])
  })

  it('summary.narrative が設定される', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.summary.narrative).toBe('Well done!')
  })

  it('badge が URL 文字列の場合は badgeClass が undefined', () => {
    const assertion = { ...V2_ASSERTION, badge: 'https://example.com/badges/abc' }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.badgeClass).toBeUndefined()
  })

  it('準拠バッジは warnings が空', () => {
    const result = normalizeV2(V2_ASSERTION as Record<string, unknown>)
    expect(result.warnings).toEqual([])
  })

  it('verification フィールドがある場合は warnings に v2.verify.field_name が含まれる', () => {
    const assertion = { ...V2_ASSERTION, verify: undefined, verification: { type: 'hosted' } }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.verify.field_name')).toBe(true)
  })

  it('verify.type が非標準の場合は warnings に v2.verify.type_invalid が含まれる', () => {
    const assertion = { ...V2_ASSERTION, verify: { type: 'HostedBadge' } }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.verify.type_invalid')).toBe(true)
  })

  it('verification フィールドは verify として正規化されアサーションに含まれる', () => {
    const assertion = { ...V2_ASSERTION, verify: undefined, verification: { type: 'hosted' } }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.assertion.verify).toEqual({ type: 'hosted' })
  })

  it('verify も verification もない場合は warnings に v2.verify.missing が含まれる', () => {
    const assertion = { ...V2_ASSERTION, verify: undefined }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.verify.missing')).toBe(true)
  })

  it('badge がない場合は warnings に v2.badge.missing が含まれる', () => {
    const assertion = { ...V2_ASSERTION, badge: undefined }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.badge.missing')).toBe(true)
  })

  it('recipient がない場合は warnings に v2.recipient.missing が含まれる', () => {
    const assertion = { ...V2_ASSERTION, recipient: undefined }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.recipient.missing')).toBe(true)
  })

  it('issuedOn がない場合は warnings に v2.issuedOn.missing が含まれる', () => {
    const assertion = { ...V2_ASSERTION, issuedOn: undefined }
    const result = normalizeV2(assertion as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v2.issuedOn.missing')).toBe(true)
  })
})
