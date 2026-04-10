// ============================================================
// Open Badges v2.0 types
// https://www.imsglobal.org/spec/ob/v2p0/
// ============================================================

export interface V2Alignment {
  targetName: string
  targetUrl: string
  targetDescription?: string
  targetCode?: string
}

export interface V2Recipient {
  type: string
  identity: string
  hashed: boolean
  salt?: string
}

export interface V2Verification {
  type: 'hosted' | 'signed'
  url?: string
  creator?: string
}

export interface V2Criteria {
  id?: string
  narrative?: string
}

export interface V2Evidence {
  id?: string
  narrative?: string
  name?: string
  description?: string
}

export interface V2Issuer {
  id: string
  type: string | string[]
  name: string
  url?: string
  email?: string
  image?: string
  description?: string
  revocationList?: string
}

export interface V2BadgeClass {
  id: string
  type: string | string[]
  name: string
  description: string
  image: string
  criteria: V2Criteria
  issuer: string | V2Issuer
  alignment?: V2Alignment[]
  tags?: string[]
}

export interface V2Assertion {
  '@context': string | string[]
  type: string | string[]
  id: string
  badge: string | V2BadgeClass
  recipient: V2Recipient
  issuedOn: string
  verify?: V2Verification
  verification?: V2Verification  // 非標準エイリアス（一部実装）
  image?: string
  evidence?: V2Evidence | V2Evidence[]
  narrative?: string
  expires?: string
  revoked?: boolean
  revocationReason?: string
}

// ============================================================
// Open Badges v3.0 types
// https://www.imsglobal.org/spec/ob/v3p0/
// Based on W3C Verifiable Credentials Data Model v2.0
// ============================================================

export interface V3Image {
  id: string
  type: string
  caption?: string
}

export interface V3Issuer {
  id: string
  type: string | string[]
  name: string
  url?: string
  email?: string
  image?: string | V3Image
  description?: string
  otherIdentifier?: Array<{ type: string; identifier: string; identifierType: string }>
}

export interface V3Criteria {
  id?: string
  narrative?: string
}

export interface V3Achievement {
  id: string
  type: string | string[]
  name: string
  description?: string
  image?: string | V3Image
  criteria?: V3Criteria
  alignment?: V2Alignment[]
  achievementType?: string
  creator?: string | V3Issuer
  tags?: string[]   // 仕様上の名前
  tag?: string[]    // Open Badge Factory 等が使う単数形バリアント
}

export interface V3IdentityObject {
  type: string
  identityHash?: string
  identityType?: string
  hashed?: boolean
  salt?: string
}

export interface V3CredentialSubject {
  id?: string
  type?: string | string[]
  name?: string
  achievement?: string | V3Achievement
  identifier?: V3IdentityObject[]  // id の代わりに使われる場合がある
}

export interface V3Proof {
  type: string
  cryptosuite?: string
  proofPurpose: string
  verificationMethod: string
  created?: string
  proofValue?: string
  challenge?: string
  domain?: string
}

export interface V3CredentialStatus {
  id: string
  type: string
  statusPurpose?: string
  statusListIndex?: string
  statusListCredential?: string
}

export interface V3Credential {
  '@context': string[]
  type: string[]
  id: string
  name?: string
  description?: string
  image?: string | V3Image
  issuer: string | V3Issuer
  validFrom: string
  validUntil?: string
  credentialSubject: V3CredentialSubject
  credentialStatus?: V3CredentialStatus
  proof?: V3Proof | V3Proof[]
  refreshService?: { id: string; type: string }
  termsOfUse?: Array<{ type: string; id?: string }>
}

// ============================================================
// Compliance warnings
// ============================================================

export interface ComplianceWarning {
  code: string
  params?: Record<string, string>
}

// ============================================================
// Error types
// ============================================================

export type ExtractionErrorCode =
  | 'NOT_PNG'
  | 'NOT_SVG'
  | 'NO_METADATA'
  | 'INVALID_JSON'
  | 'FETCH_CORS'
  | 'FETCH_NOT_FOUND'
  | 'FETCH_NETWORK'
  | 'UNSUPPORTED_VERSION'

export class BadgeExtractionError extends Error {
  readonly code: ExtractionErrorCode

  constructor(message: string, code: ExtractionErrorCode) {
    super(message)
    this.name = 'BadgeExtractionError'
    this.code = code
  }
}

// ============================================================
// Normalized types for display
// ============================================================

export type BadgeVersion = 'v2.0' | 'v3.0' | 'unknown'

export interface NormalizedSummary {
  name?: string
  description?: string
  image?: string
  recipientIdentity?: string
  issuedOn?: string
  expires?: string
  issuerName?: string
  issuerUrl?: string
  issuerImage?: string
  criteria?: string
  tags?: string[]
  narrative?: string
}

export interface NormalizedBadgeV2 {
  version: 'v2.0'
  raw: V2Assertion
  summary: NormalizedSummary
  assertion: V2Assertion
  badgeClass?: V2BadgeClass
  issuer?: V2Issuer
  warnings: ComplianceWarning[]
}

export interface NormalizedBadgeV3 {
  version: 'v3.0'
  raw: V3Credential
  summary: NormalizedSummary
  credential: V3Credential
  achievement?: V3Achievement
  issuer?: V3Issuer
  warnings: ComplianceWarning[]
}

export type NormalizedBadge = NormalizedBadgeV2 | NormalizedBadgeV3
