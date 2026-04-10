import { useState } from 'react'
import { JsonView, defaultStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  data: unknown
}

export function JsonViewer({ data }: Props) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
        <span className="text-xs font-medium text-gray-600">JSON</span>
        <button
          onClick={handleCopy}
          aria-label={t('json.copy.label')}
          className={[
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300',
          ].join(' ')}
        >
          {copied ? t('json.copied') : t('json.copy')}
        </button>
      </div>
      <div className="overflow-auto p-4 text-sm">
        <JsonView
          data={data as object}
          style={{
            ...defaultStyles,
            container: 'font-mono text-xs leading-relaxed',
          }}
          shouldExpandNode={(level) => level < 2}
        />
      </div>
    </div>
  )
}
