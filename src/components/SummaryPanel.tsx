import type { NormalizedBadge } from '../types/badges'
import { VersionBadge } from './VersionBadge'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  badge: NormalizedBadge
}

export function SummaryPanel({ badge }: Props) {
  const { locale, t } = useLocale()
  const { summary, version } = badge

  // issuerName が URL 文字列（未リゾルブ）のときはリンクとして扱う
  const issuerIsUrl = isHttpUrl(summary.issuerName)
  const issuerHref = summary.issuerUrl ?? (issuerIsUrl ? summary.issuerName : undefined)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-5">
        {/* Badge image */}
        <BadgeImage image={summary.image} name={summary.name} altFallback={t('summary.unnamed')} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">
              {summary.name ?? t('summary.unnamed')}
            </h2>
            <VersionBadge version={version} />
          </div>

          {summary.description && (
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              {summary.description}
            </p>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t('summary.issuer')} value={summary.issuerName} href={issuerHref} />
        <Field label={t('summary.recipient')} value={summary.recipientIdentity} mono />
        <Field label={t('summary.issuedOn')} value={formatDate(summary.issuedOn, locale)} />
        <Field label={t('summary.expires')} value={formatDate(summary.expires, locale)} />
        {summary.criteria && (
          <div className="sm:col-span-2">
            <Field label={t('summary.criteria')} value={summary.criteria} />
          </div>
        )}
        {summary.narrative && (
          <div className="sm:col-span-2">
            <Field label={t('summary.narrative')} value={summary.narrative} />
          </div>
        )}
        {summary.tags && summary.tags.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('summary.tags')}
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {summary.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

function BadgeImage({ image, name, altFallback }: { image?: string; name?: string; altFallback: string }) {
  if (!image) {
    return (
      <div
        aria-hidden="true"
        className="h-20 w-20 shrink-0 rounded-lg border border-gray-100 bg-gray-100 flex items-center justify-center"
      >
        <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.866 3.473 3.745 3.745 0 01-3.473.866A3.735 3.735 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.473-.866 3.745 3.745 0 01-.866-3.473A3.735 3.735 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.866-3.473 3.745 3.745 0 013.473-.866A3.735 3.735 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.473.866 3.745 3.745 0 01.866 3.473A3.735 3.735 0 0121 12z" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={image}
      alt={name ?? altFallback}
      className="h-20 w-20 shrink-0 rounded-lg object-contain border border-gray-100 bg-gray-50 p-1"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.target as HTMLImageElement
        img.style.display = 'none'
        img.nextElementSibling?.removeAttribute('style')
      }}
    />
  )
}

function Field({
  label,
  value,
  href,
  mono = false,
}: {
  label: string
  value?: string
  href?: string
  mono?: boolean
}) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className={['mt-1 text-sm text-gray-900 break-all', mono && 'font-mono'].filter(Boolean).join(' ')}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-violet-700 hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function isHttpUrl(str?: string): boolean {
  return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'))
}

function formatDate(iso?: string, locale?: string): string | undefined {
  if (!iso) return undefined
  try {
    return new Date(iso).toLocaleString(locale ?? 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
