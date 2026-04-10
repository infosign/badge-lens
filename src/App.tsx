import { useState } from 'react'
import type { NormalizedBadge } from './types/badges'
import { extractFromFile, extractFromUrl } from './lib/extract'
import { BadgeInput } from './components/BadgeInput'
import { MetadataView } from './components/MetadataView'
import { ErrorMessage } from './components/ErrorMessage'
import { useLocale } from './contexts/LocaleContext'

type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; badge: NormalizedBadge }
  | { status: 'error'; error: unknown }

export default function App() {
  const { t } = useLocale()
  const [state, setState] = useState<AppState>({ status: 'idle' })

  async function handleFile(file: File) {
    setState({ status: 'loading' })
    try {
      const badge = await extractFromFile(file)
      setState({ status: 'success', badge })
    } catch (err) {
      setState({ status: 'error', error: err })
    }
  }

  async function handleUrl(url: string) {
    setState({ status: 'loading' })
    try {
      const badge = await extractFromUrl(url)
      setState({ status: 'success', badge })
    } catch (err) {
      setState({ status: 'error', error: err })
    }
  }

  function handleReset() {
    setState({ status: 'idle' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <BadgeIcon />
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              Open Badges Extractor
            </h1>
            <p className="text-xs text-gray-400">{t('app.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6" aria-live="polite">
        {/* 入力エリア: idle と loading 中は常に表示 */}
        {state.status !== 'success' && (
          <section aria-label={t('app.input.section')}>
            <BadgeInput
              onFile={handleFile}
              onUrl={handleUrl}
              loading={state.status === 'loading'}
            />
          </section>
        )}

        {state.status === 'loading' && (
          <div
            role="status"
            aria-label={t('app.loading')}
            className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500"
          >
            <Spinner />
            <span>{t('app.loading')}</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="space-y-3">
            <ErrorMessage error={state.error} />
            <button
              onClick={handleReset}
              className="text-sm text-violet-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
            >
              {t('app.retry')}
            </button>
          </div>
        )}

        {state.status === 'success' && (
          <MetadataView badge={state.badge} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-16 border-t border-gray-100 bg-white py-4 text-center text-xs text-gray-400">
        {t('app.footer')}
      </footer>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin text-violet-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

function BadgeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-violet-600 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.866 3.473 3.745 3.745 0 01-3.473.866A3.735 3.735 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.473-.866 3.745 3.745 0 01-.866-3.473A3.735 3.735 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.866-3.473 3.745 3.745 0 013.473-.866A3.735 3.735 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.473.866 3.745 3.745 0 01.866 3.473A3.735 3.735 0 0121 12z"
      />
    </svg>
  )
}
