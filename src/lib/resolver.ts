import type {
  NormalizedBadge,
  NormalizedBadgeV2,
  NormalizedBadgeV3,
  NormalizedSummary,
  V2BadgeClass,
  V2Issuer,
  V3Issuer,
  V3Image,
} from '../types/badges'

const MAX_DEPTH = 2

/**
 * NormalizedBadge の外部 URL 参照（BadgeClass / Issuer）を fetch して解決する。
 * fetch 失敗時はエラーを投げず、URL 文字列のまま保持する（警告レベル）。
 */
export async function resolveReferences(badge: NormalizedBadge): Promise<NormalizedBadge> {
  if (badge.version === 'v2.0') return resolveV2(badge)
  return resolveV3(badge)
}

// ---- v2.0 ----

async function resolveV2(badge: NormalizedBadgeV2): Promise<NormalizedBadgeV2> {
  let { badgeClass, issuer } = badge

  // badge フィールドが URL 文字列の場合はリゾルブ
  if (typeof badge.assertion.badge === 'string') {
    const fetched = await fetchJson<V2BadgeClass>(badge.assertion.badge, MAX_DEPTH)
    if (fetched) badgeClass = fetched
  }

  // issuer フィールドが URL 文字列の場合はリゾルブ
  if (badgeClass && typeof badgeClass.issuer === 'string') {
    const fetched = await fetchJson<V2Issuer>(badgeClass.issuer, MAX_DEPTH)
    if (fetched) issuer = fetched
  }

  // summary を再構築
  const summary = buildV2Summary(badge.assertion, badgeClass, issuer)

  return { ...badge, badgeClass, issuer, summary }
}

function buildV2Summary(
  assertion: NormalizedBadgeV2['assertion'],
  badgeClass?: V2BadgeClass,
  issuer?: V2Issuer,
): NormalizedSummary {
  return {
    name: badgeClass?.name,
    description: badgeClass?.description,
    image: pickImage(assertion.image ?? badgeClass?.image),
    recipientIdentity: assertion.recipient?.identity,
    issuedOn: assertion.issuedOn,
    expires: assertion.expires,
    issuerName:
      issuer?.name ??
      (typeof badgeClass?.issuer === 'string' ? badgeClass.issuer : undefined),
    issuerUrl: issuer?.url,
    issuerImage: pickImage(issuer?.image),
    criteria: badgeClass?.criteria?.narrative,
    tags: badgeClass?.tags,
    narrative: assertion.narrative,
  }
}

// ---- v3.0 ----

async function resolveV3(badge: NormalizedBadgeV3): Promise<NormalizedBadgeV3> {
  let { issuer } = badge

  // issuer が URL 文字列の場合はリゾルブ
  if (typeof badge.credential.issuer === 'string') {
    const fetched = await fetchJson<V3Issuer>(badge.credential.issuer, MAX_DEPTH)
    if (fetched) issuer = fetched
  }

  const summary = buildV3Summary(badge.credential, badge.achievement, issuer)

  return { ...badge, issuer, summary }
}

function buildV3Summary(
  credential: NormalizedBadgeV3['credential'],
  achievement: NormalizedBadgeV3['achievement'],
  issuer?: V3Issuer,
): NormalizedSummary {
  return {
    name: credential.name ?? achievement?.name,
    description: credential.description ?? achievement?.description,
    image: pickImage(credential.image ?? achievement?.image),
    recipientIdentity: credential.credentialSubject?.id,
    issuedOn: credential.validFrom,
    expires: credential.validUntil,
    issuerName:
      issuer?.name ??
      (typeof credential.issuer === 'string' ? credential.issuer : undefined),
    issuerUrl: issuer?.url,
    issuerImage: pickImage(issuer?.image),
    criteria: achievement?.criteria?.narrative,
    tags: achievement?.tags,
  }
}

// ---- helpers ----

function pickImage(image: string | V3Image | undefined): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  return image.id
}

/**
 * URL から JSON を fetch する。失敗時は null を返す（エラーを握り潰す）。
 * depth は循環参照防止用。
 */
async function fetchJson<T>(url: string, depth: number): Promise<T | null> {
  if (depth <= 0 || !isHttpUrl(url)) return null

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json, application/ld+json, */*' },
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (typeof json !== 'object' || json === null) return null
    return json as T
  } catch {
    // CORS / ネットワークエラーは無視して null を返す
    return null
  }
}

function isHttpUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://')
}
