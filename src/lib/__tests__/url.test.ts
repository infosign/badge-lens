import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchFromUrl } from '../extractors/url'
import { BadgeExtractionError } from '../../types/badges'

const ASSERTION_JSON = JSON.stringify({ '@context': 'https://w3id.org/badges/v2', type: 'Assertion' })

function mockFetch(status: number, body: string, ok = status >= 200 && status < 300) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(body),
  }))
}

function mockFetchNetworkError(message = 'Failed to fetch') {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError(message)))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchFromUrl', () => {
  it('正常な JSON 文字列を返す', async () => {
    mockFetch(200, ASSERTION_JSON)
    const result = await fetchFromUrl('https://example.com/assertions/1')
    expect(result).toBe(ASSERTION_JSON)
  })

  it('Accept ヘッダを送信する', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(ASSERTION_JSON) })
    vi.stubGlobal('fetch', fetchMock)
    await fetchFromUrl('https://example.com/assertions/1')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/assertions/1',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: expect.stringContaining('application/json') }),
      }),
    )
  })

  it('404 は FETCH_NOT_FOUND エラー', async () => {
    mockFetch(404, 'Not Found', false)
    await expect(fetchFromUrl('https://example.com/missing')).rejects.toThrowError(BadgeExtractionError)
    try {
      await fetchFromUrl('https://example.com/missing')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('FETCH_NOT_FOUND')
    }
  })

  it('500 は FETCH_NETWORK エラー', async () => {
    mockFetch(500, 'Server Error', false)
    await expect(fetchFromUrl('https://example.com/error')).rejects.toThrowError(BadgeExtractionError)
    try {
      await fetchFromUrl('https://example.com/error')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('FETCH_NETWORK')
    }
  })

  it('"Failed to fetch" TypeError は FETCH_CORS エラー', async () => {
    mockFetchNetworkError('Failed to fetch')
    await expect(fetchFromUrl('https://example.com/cors')).rejects.toThrowError(BadgeExtractionError)
    try {
      await fetchFromUrl('https://example.com/cors')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('FETCH_CORS')
    }
  })

  it('NetworkError TypeError は FETCH_CORS エラー', async () => {
    mockFetchNetworkError('NetworkError when attempting to fetch resource.')
    await expect(fetchFromUrl('https://example.com/cors')).rejects.toThrowError(BadgeExtractionError)
    try {
      await fetchFromUrl('https://example.com/cors')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('FETCH_CORS')
    }
  })
})
