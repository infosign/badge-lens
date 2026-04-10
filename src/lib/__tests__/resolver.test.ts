import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveReferences } from '../resolver'
import type { NormalizedBadgeV2, NormalizedBadgeV3, V2Assertion, V3Credential } from '../../types/badges'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetchJson(url: string, data: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((input: string) => {
    if (input === url) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) })
  }))
}

function mockFetchFail() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
}

// ---- v2.0 テスト用フィクスチャ ----

const BADGE_CLASS = {
  id: 'https://example.com/badges/abc',
  type: 'BadgeClass',
  name: 'Resolved Badge',
  description: 'desc',
  image: 'https://example.com/badge.png',
  criteria: { narrative: 'criteria' },
  issuer: 'https://example.com/issuer',
}

const ISSUER = {
  id: 'https://example.com/issuer',
  type: 'Issuer',
  name: 'Resolved Org',
  url: 'https://example.com',
}

function makeV2Badge(badgeValue: string | object): NormalizedBadgeV2 {
  const assertion = {
    '@context': 'https://w3id.org/badges/v2',
    type: 'Assertion',
    id: 'https://example.com/assertions/1',
    badge: badgeValue,
    recipient: { type: 'email', hashed: false, identity: 'test@example.com' },
    issuedOn: '2024-01-01T00:00:00Z',
    verify: { type: 'hosted' as const, url: 'https://example.com/assertions/1' },
  } as unknown as V2Assertion
  return {
    version: 'v2.0',
    raw: assertion,
    assertion,
    badgeClass: undefined,
    issuer: undefined,
    summary: {},
    warnings: [],
  }
}

describe('resolveReferences (v2.0)', () => {
  it('badge が URL のとき BadgeClass を fetch してリゾルブする', async () => {
    mockFetchJson(BADGE_CLASS.id, BADGE_CLASS)
    const badge = makeV2Badge(BADGE_CLASS.id)
    const result = await resolveReferences(badge)
    expect(result.version).toBe('v2.0')
    if (result.version === 'v2.0') {
      expect(result.badgeClass?.name).toBe('Resolved Badge')
    }
  })

  it('issuer が URL のとき Issuer を fetch してリゾルブする', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === BADGE_CLASS.id) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(BADGE_CLASS) })
      if (url === ISSUER.id) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(ISSUER) })
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) })
    }))
    const badge = makeV2Badge(BADGE_CLASS.id)
    const result = await resolveReferences(badge)
    if (result.version === 'v2.0') {
      expect(result.issuer?.name).toBe('Resolved Org')
    }
  })

  it('fetch 失敗時は badgeClass が undefined のまま（エラーを投げない）', async () => {
    mockFetchFail()
    const badge = makeV2Badge(BADGE_CLASS.id)
    await expect(resolveReferences(badge)).resolves.toBeDefined()
    const result = await resolveReferences(badge)
    if (result.version === 'v2.0') {
      expect(result.badgeClass).toBeUndefined()
    }
  })

  it('badge がインラインオブジェクトのとき fetch しない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const inlineBadge = { ...BADGE_CLASS, issuer: ISSUER }
    const badge = makeV2Badge(inlineBadge)
    badge.badgeClass = inlineBadge as unknown as NormalizedBadgeV2['badgeClass']
    badge.issuer = ISSUER as unknown as NormalizedBadgeV2['issuer']
    await resolveReferences(badge)
    // badge URL がないので issuer の fetch のみ（issuerもオブジェクトなので0回）
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('http でない URL（urn:）はリゾルブしない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const badge = makeV2Badge('urn:example:badge:1')
    await resolveReferences(badge)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ---- v3.0 テスト用フィクスチャ ----

function makeV3Badge(issuerValue: string | object): NormalizedBadgeV3 {
  const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    id: 'urn:uuid:abc',
    issuer: issuerValue,
    validFrom: '2024-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:recipient' },
  } as unknown as V3Credential
  return {
    version: 'v3.0',
    raw: credential,
    credential,
    achievement: undefined,
    issuer: undefined,
    summary: {},
    warnings: [],
  }
}

describe('resolveReferences (v3.0)', () => {
  it('issuer が URL のとき Issuer を fetch してリゾルブする', async () => {
    mockFetchJson(ISSUER.id, ISSUER)
    const badge = makeV3Badge(ISSUER.id)
    const result = await resolveReferences(badge)
    if (result.version === 'v3.0') {
      expect(result.issuer?.name).toBe('Resolved Org')
    }
  })

  it('fetch 失敗時は issuer が undefined のまま（エラーを投げない）', async () => {
    mockFetchFail()
    const badge = makeV3Badge(ISSUER.id)
    await expect(resolveReferences(badge)).resolves.toBeDefined()
    const result = await resolveReferences(badge)
    if (result.version === 'v3.0') {
      expect(result.issuer).toBeUndefined()
    }
  })

  it('issuer がオブジェクトのとき fetch しない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const badge = makeV3Badge(ISSUER)
    badge.issuer = ISSUER as unknown as NormalizedBadgeV3['issuer']
    await resolveReferences(badge)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
