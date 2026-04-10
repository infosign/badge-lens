import type { NormalizedBadge, ComplianceWarning, V3Image } from '../../types/badges'

interface UrlEntry {
  field: string
  url: string
  isImage: boolean
}

const TIMEOUT_MS = 10_000

/**
 * バッジメタデータに含まれる全 HTTP(S) URL を収集する。
 */
export function collectUrls(badge: NormalizedBadge): UrlEntry[] {
  const entries: UrlEntry[] = []

  function add(field: string, value: unknown, isImage = false) {
    if (isHttpUrl(value)) entries.push({ field, url: value, isImage })
  }

  function pickImageUrl(image: unknown): string | undefined {
    if (isHttpUrl(image)) return image
    if (typeof image === 'object' && image !== null && isHttpUrl((image as V3Image).id)) {
      return (image as V3Image).id
    }
    return undefined
  }

  if (badge.version === 'v2.0') {
    const { assertion, badgeClass, issuer } = badge
    add('assertion.id', assertion.id)
    add('badge', typeof assertion.badge === 'string' ? assertion.badge : undefined)
    add('badgeClass.image', pickImageUrl(badgeClass?.image), true)
    add('badgeClass.issuer', typeof badgeClass?.issuer === 'string' ? badgeClass.issuer : undefined)
    add('badgeClass.criteria.id', badgeClass?.criteria?.id)
    add('verify.url', assertion.verify?.url)
    add('issuer.image', pickImageUrl(issuer?.image), true)
    add('issuer.url', issuer?.url)
  } else {
    const { credential, issuer, achievement } = badge
    add('credential.id', credential.id)
    add('issuer', typeof credential.issuer === 'string' ? credential.issuer : issuer?.id)
    add('issuer.image', pickImageUrl(issuer?.image), true)
    add('achievement.image', pickImageUrl(achievement?.image), true)
    add('credentialSubject.id', credential.credentialSubject?.id)
    add('credentialStatus.id', credential.credentialStatus?.id)
  }

  // 重複 URL を除去
  const seen = new Set<string>()
  return entries.filter(({ url }) => {
    if (seen.has(url)) return false
    seen.add(url)
    return true
  })
}

/**
 * バッジ内の全 URL にアクセスして到達不可・HTTP エラーを警告として返す。
 */
export async function checkUrlHealth(badge: NormalizedBadge): Promise<ComplianceWarning[]> {
  const urls = collectUrls(badge)
  const results = await Promise.all(
    urls.map(({ field, url, isImage }) =>
      isImage ? checkImageUrl(field, url) : checkFetchUrl(field, url),
    ),
  )
  return results.filter((w): w is ComplianceWarning => w !== null)
}

/**
 * 画像 URL のチェック。Image オブジェクトで読み込み可否を確認する。
 * CORS 制限を受けないため、500 空レスポンス等も検出できる。
 */
function checkImageUrl(field: string, url: string): Promise<ComplianceWarning | null> {
  if (typeof Image === 'undefined') return Promise.resolve(null)

  return Promise.race([
    new Promise<ComplianceWarning | null>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(null)
      img.onerror = () => resolve({ code: 'url.image_broken', params: { field, url } })
      img.src = url
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
  ])
}

/**
 * JSON・API URL のチェック。HEAD リクエストで HTTP ステータスを確認する。
 * CORS エラー時は no-cors で再確認してネットワーク障害と切り分ける。
 */
async function checkFetchUrl(field: string, url: string): Promise<ComplianceWarning | null> {
  const signal = AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined

  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-store', signal })
    if (!res.ok) {
      return { code: 'url.http_error', params: { field, url, status: String(res.status) } }
    }
    return null
  } catch {
    // CORS エラーまたはネットワークエラー。no-cors で再確認する。
    try {
      await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal })
      // サーバーは応答した（opaque レスポンス）がステータス不明 → 警告なし
      return null
    } catch {
      return { code: 'url.network_error', params: { field, url } }
    }
  }
}

function isHttpUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value.startsWith('http://') || value.startsWith('https://'))
  )
}
