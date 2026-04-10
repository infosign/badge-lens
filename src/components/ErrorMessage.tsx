import { BadgeExtractionError } from '../types/badges'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  error: unknown
}

export function ErrorMessage({ error }: Props) {
  const { t } = useLocale()

  const code =
    error instanceof BadgeExtractionError ? error.code : undefined

  const message = code
    ? t('error.' + code)
    : t('error.unknown')

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p className="font-semibold">{t('error.title')}{code ? ` [${code}]` : ''}</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}
