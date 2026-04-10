import { describe, it, expect } from 'vitest'
import { normalizeV3 } from '../parsers/v3'

const INLINE_ACHIEVEMENT = {
  id: 'https://example.com/achievements/abc',
  type: ['Achievement'],
  name: 'Test Achievement',
  description: 'A test achievement',
  image: { id: 'https://example.com/badge.png', type: 'Image' },
  criteria: { narrative: 'Complete the task' },
  tags: ['skill'],
}

const V3_CREDENTIAL = {
  '@context': ['https://www.w3.org/ns/credentials/v2', 'https://w3id.org/badges/v3'],
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  id: 'urn:uuid:abc-123',
  name: 'My Credential',
  description: 'Credential description',
  issuer: {
    id: 'https://example.com/issuer',
    type: ['Profile'],
    name: 'Example Org',
    url: 'https://example.com',
    image: { id: 'https://example.com/logo.png', type: 'Image' },
  },
  validFrom: '2024-01-01T00:00:00Z',
  validUntil: '2025-12-31T23:59:59Z',
  credentialSubject: {
    id: 'did:example:recipient',
    type: ['AchievementSubject'],
    achievement: INLINE_ACHIEVEMENT,
  },
  proof: {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-rdfc-2022',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'https://example.com/issuer#key-1',
    created: '2024-01-01T12:00:00Z',
    proofValue: 'zABC123',
  },
}

describe('normalizeV3', () => {
  it('version が v3.0 である', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.version).toBe('v3.0')
  })

  it('raw に元のクレデンシャルが入っている', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.raw).toEqual(V3_CREDENTIAL)
  })

  it('issuer がインライン展開される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.issuer?.name).toBe('Example Org')
  })

  it('achievement がインライン展開される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.achievement?.name).toBe('Test Achievement')
  })

  it('summary.name がクレデンシャルの name から設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.name).toBe('My Credential')
  })

  it('summary.name が credential.name 未設定なら achievement.name にフォールバック', () => {
    const cred = { ...V3_CREDENTIAL, name: undefined }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.summary.name).toBe('Test Achievement')
  })

  it('summary.image が V3Image オブジェクトから id を取り出す', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.image).toBe('https://example.com/badge.png')
  })

  it('summary.recipientIdentity が credentialSubject.id から設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.recipientIdentity).toBe('did:example:recipient')
  })

  it('summary.issuedOn が validFrom から設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.issuedOn).toBe('2024-01-01T00:00:00Z')
  })

  it('summary.expires が validUntil から設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.expires).toBe('2025-12-31T23:59:59Z')
  })

  it('summary.issuerName が設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.issuerName).toBe('Example Org')
  })

  it('summary.issuerUrl が設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.issuerUrl).toBe('https://example.com')
  })

  it('summary.criteria が設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.criteria).toBe('Complete the task')
  })

  it('summary.tags が設定される', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.summary.tags).toEqual(['skill'])
  })

  it('issuer が URL 文字列の場合は issuer が undefined', () => {
    const cred = { ...V3_CREDENTIAL, issuer: 'https://example.com/issuer' }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.issuer).toBeUndefined()
    expect(result.summary.issuerName).toBe('https://example.com/issuer')
  })

  it('準拠バッジは warnings が空', () => {
    const result = normalizeV3(V3_CREDENTIAL as Record<string, unknown>)
    expect(result.warnings).toEqual([])
  })

  it('achievement.tag（単数形）がある場合は warnings に v3.achievement.tag_field_name が含まれる', () => {
    const cred = {
      ...V3_CREDENTIAL,
      credentialSubject: {
        ...V3_CREDENTIAL.credentialSubject,
        achievement: { ...INLINE_ACHIEVEMENT, tags: undefined, tag: ['skill'] },
      },
    }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v3.achievement.tag_field_name')).toBe(true)
  })

  it('issuer がない場合は warnings に v3.issuer.missing が含まれる', () => {
    const cred = { ...V3_CREDENTIAL, issuer: undefined }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v3.issuer.missing')).toBe(true)
  })

  it('credentialSubject がない場合は warnings に v3.credentialSubject.missing が含まれる', () => {
    const cred = { ...V3_CREDENTIAL, credentialSubject: undefined }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v3.credentialSubject.missing')).toBe(true)
  })

  it('validFrom がなく awardedDate がある場合は warnings に v3.validFrom.non_standard が含まれる', () => {
    const cred = { ...V3_CREDENTIAL, validFrom: undefined, awardedDate: '2024-01-01T00:00:00Z' }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v3.validFrom.non_standard')).toBe(true)
  })

  it('validFrom も awardedDate もない場合は warnings に v3.validFrom.missing が含まれる', () => {
    const cred = { ...V3_CREDENTIAL, validFrom: undefined }
    const result = normalizeV3(cred as unknown as Record<string, unknown>)
    expect(result.warnings.some((w) => w.code === 'v3.validFrom.missing')).toBe(true)
  })
})
