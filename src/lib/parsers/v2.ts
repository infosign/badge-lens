import type {
  V2Assertion,
  V2BadgeClass,
  V2Issuer,
  NormalizedBadgeV2,
  NormalizedSummary,
  ComplianceWarning,
} from '../../types/badges'

/**
 * v2.0 Assertion を NormalizedBadgeV2 に正規化する。
 * BadgeClass・Issuer はこの時点では未リゾルブ（URL のまま）。
 * リゾルブは resolver.ts が担当する。
 */
export function normalizeV2(raw: Record<string, unknown>): NormalizedBadgeV2 {
  // "verification" を "verify" の非標準エイリアスとして扱う
  const hasVerify = raw['verify'] != null
  const normalized: Record<string, unknown> =
    !hasVerify && 'verification' in raw
      ? { ...raw, verify: raw['verification'] }
      : raw

  const assertion = normalized as unknown as V2Assertion

  const badgeClass = typeof assertion.badge === 'object' ? assertion.badge : undefined
  const issuer =
    badgeClass && typeof badgeClass.issuer === 'object' ? badgeClass.issuer : undefined

  const summary = buildSummary(assertion, badgeClass, issuer)
  const warnings = checkCompliance(raw)

  return {
    version: 'v2.0',
    raw: assertion,
    summary,
    assertion,
    badgeClass,
    issuer,
    warnings,
  }
}

const VALID_VERIFY_TYPES = new Set(['hosted', 'signed'])

function checkCompliance(raw: Record<string, unknown>): ComplianceWarning[] {
  const warnings: ComplianceWarning[] = []

  // 必須フィールド: badge
  if (raw['badge'] == null) {
    warnings.push({ code: 'v2.badge.missing' })
  }

  // 必須フィールド: recipient
  if (raw['recipient'] == null) {
    warnings.push({ code: 'v2.recipient.missing' })
  }

  // 必須フィールド: issuedOn
  if (raw['issuedOn'] == null) {
    warnings.push({ code: 'v2.issuedOn.missing' })
  }

  // 必須フィールド: verify / verification
  const hasVerify = raw['verify'] != null
  const hasVerification = raw['verification'] != null
  if (!hasVerify && !hasVerification) {
    warnings.push({ code: 'v2.verify.missing' })
  } else if (!hasVerify && hasVerification) {
    warnings.push({ code: 'v2.verify.field_name' })
  }

  // verify.type の値
  const verifyLike = (raw['verify'] ?? raw['verification']) as Record<string, unknown> | undefined
  const verifyType = verifyLike?.['type']
  if (typeof verifyType === 'string' && !VALID_VERIFY_TYPES.has(verifyType)) {
    warnings.push({ code: 'v2.verify.type_invalid', params: { type: verifyType } })
  }

  return warnings
}

function buildSummary(
  assertion: V2Assertion,
  badgeClass?: V2BadgeClass,
  issuer?: V2Issuer,
): NormalizedSummary {
  return {
    name: badgeClass?.name,
    description: badgeClass?.description,
    image: resolveImage(assertion.image ?? badgeClass?.image),
    recipientIdentity: assertion.recipient?.identity,
    issuedOn: assertion.issuedOn,
    expires: assertion.expires,
    issuerName: issuer?.name ?? (typeof badgeClass?.issuer === 'string' ? badgeClass.issuer : undefined),
    issuerUrl: issuer?.url,
    issuerImage: resolveImage(issuer?.image),
    criteria: badgeClass?.criteria?.narrative,
    tags: badgeClass?.tags,
    narrative: assertion.narrative,
  }
}

function resolveImage(image: string | undefined): string | undefined {
  return typeof image === 'string' ? image : undefined
}
