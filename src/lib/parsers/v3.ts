import type {
  V3Credential,
  V3Achievement,
  V3Issuer,
  V3Image,
  NormalizedBadgeV3,
  NormalizedSummary,
  ComplianceWarning,
} from '../../types/badges'

/**
 * v3.0 OpenBadgeCredential を NormalizedBadgeV3 に正規化する。
 */
export function normalizeV3(raw: Record<string, unknown>): NormalizedBadgeV3 {
  const credential = raw as unknown as V3Credential

  const issuer =
    typeof credential.issuer === 'object' ? (credential.issuer as V3Issuer) : undefined

  const subject = credential.credentialSubject
  const achievement =
    subject && typeof subject.achievement === 'object'
      ? (subject.achievement as V3Achievement)
      : undefined

  const summary = buildSummary(credential, achievement, issuer)
  const warnings = checkCompliance(raw)

  return {
    version: 'v3.0',
    raw: credential,
    summary,
    credential,
    achievement,
    issuer,
    warnings,
  }
}

function checkCompliance(raw: Record<string, unknown>): ComplianceWarning[] {
  const warnings: ComplianceWarning[] = []

  // 必須フィールド: issuer
  if (raw['issuer'] == null) {
    warnings.push({ code: 'v3.issuer.missing' })
  }

  // 必須フィールド: validFrom
  if (raw['validFrom'] == null) {
    if (raw['awardedDate'] != null) {
      warnings.push({ code: 'v3.validFrom.non_standard' })
    } else {
      warnings.push({ code: 'v3.validFrom.missing' })
    }
  }

  // 必須フィールド: credentialSubject
  const subject = raw['credentialSubject'] as Record<string, unknown> | undefined
  if (subject == null) {
    warnings.push({ code: 'v3.credentialSubject.missing' })
  }

  // achievement.tag vs tags
  const achievement = subject?.['achievement'] as Record<string, unknown> | undefined
  if (achievement && achievement['tags'] == null && 'tag' in achievement) {
    warnings.push({ code: 'v3.achievement.tag_field_name' })
  }

  return warnings
}

function buildSummary(
  credential: V3Credential,
  achievement?: V3Achievement,
  issuer?: V3Issuer,
): NormalizedSummary {
  return {
    name: credential.name ?? achievement?.name,
    description: credential.description ?? achievement?.description,
    image: resolveImage(credential.image ?? achievement?.image),
    recipientIdentity: resolveRecipientIdentity(credential.credentialSubject),
    issuedOn: credential.validFrom ?? (credential as unknown as Record<string, string>)['awardedDate'],
    expires: credential.validUntil,
    issuerName:
      issuer?.name ??
      (typeof credential.issuer === 'string' ? credential.issuer : undefined),
    issuerUrl: issuer?.url,
    issuerImage: resolveImage(issuer?.image),
    criteria: achievement?.criteria?.narrative,
    // "tags" と "tag"（単数形）の両方に対応
    tags: achievement?.tags ?? achievement?.tag,
  }
}

/**
 * credentialSubject から受領者識別子を取得する。
 * - `id` フィールドが最優先
 * - なければ `identifier[0].identityHash` にフォールバック
 */
function resolveRecipientIdentity(
  subject: V3Credential['credentialSubject'] | undefined,
): string | undefined {
  if (!subject) return undefined
  if (subject.id) return subject.id
  const first = subject.identifier?.[0]
  if (first?.identityHash) return first.identityHash
  return undefined
}

function resolveImage(image: string | V3Image | undefined): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  return image.id
}
