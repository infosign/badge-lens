import type { NormalizedBadge, ComplianceWarning } from '../types/badges'
import { SummaryPanel } from './SummaryPanel'
import { DetailTabs } from './DetailTabs'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  badge: NormalizedBadge
  onReset: () => void
}

export function MetadataView({ badge, onReset }: Props) {
  const { t } = useLocale()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{t('result.title')}</h2>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t('result.reset')}
        </button>
      </div>
      <SummaryPanel badge={badge} />
      {badge.warnings.length > 0 && (
        <ComplianceWarnings warnings={badge.warnings} />
      )}
      <DetailTabs badge={badge} />
    </div>
  )
}

function ComplianceWarnings({ warnings }: { warnings: ComplianceWarning[] }) {
  const { t } = useLocale()
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800">
            {t('warnings.title')}
          </p>
          <ul className="mt-1.5 space-y-1 list-disc list-inside">
            {warnings.map((w) => (
              <li key={w.code} className="text-sm text-amber-700">
                {t('warning.' + w.code, w.params)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-600">
            {t('warnings.footer')}
          </p>
        </div>
      </div>
    </div>
  )
}
