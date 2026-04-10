import { useRef, useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  onFile: (file: File) => void
  onUrl: (url: string) => void
  loading: boolean
}

export function BadgeInput({ onFile, onUrl, loading }: Props) {
  const { t } = useLocale()
  const [urlValue, setUrlValue] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (loading || !files || files.length === 0) return
    onFile(files[0])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (!loading) handleFiles(e.dataTransfer.files)
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = urlValue.trim()
    if (trimmed) onUrl(trimmed)
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={loading ? -1 : 0}
        aria-label={t('input.dropzone.label')}
        aria-disabled={loading}
        onClick={() => !loading && fileInputRef.current?.click()}
        onKeyDown={(e) => !loading && e.key === 'Enter' && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!loading) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-3',
          'rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          loading
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
            : dragging
              ? 'cursor-pointer border-violet-400 bg-violet-50'
              : 'cursor-pointer border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
        ].join(' ')}
      >
        <UploadIcon />
        <div>
          <p className="text-sm font-medium text-gray-700">{t('input.dropzone.title')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('input.dropzone.hint')}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.svg,image/png,image/svg+xml"
          disabled={loading}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          aria-hidden="true"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400">{t('input.divider')}</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      {/* URL input */}
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <label htmlFor="badge-url" className="sr-only">
          {t('input.url.label')}
        </label>
        <input
          id="badge-url"
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          placeholder={t('input.url.placeholder')}
          disabled={loading}
          className={[
            'min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200',
            loading && 'opacity-50',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={loading || !urlValue.trim()}
          className={[
            'rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white',
            'hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400',
            'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
          ].join(' ')}
        >
          {loading ? t('input.submit.loading') : t('input.submit')}
        </button>
      </form>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}
