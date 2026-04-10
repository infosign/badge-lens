import { useState, useRef } from 'react'
import type { NormalizedBadge, NormalizedBadgeV2, NormalizedBadgeV3 } from '../types/badges'
import { JsonViewer } from './JsonViewer'
import { useLocale } from '../contexts/LocaleContext'

interface Props {
  badge: NormalizedBadge
}

export function DetailTabs({ badge }: Props) {
  if (badge.version === 'v2.0') return <V2Tabs badge={badge} />
  return <V3Tabs badge={badge} />
}

// ---- v2.0 ----

function V2Tabs({ badge }: { badge: NormalizedBadgeV2 }) {
  const tabs = [
    { id: 'assertion', label: 'Assertion' },
    ...(badge.badgeClass ? [{ id: 'badgeclass', label: 'BadgeClass' }] : []),
    ...(badge.issuer ? [{ id: 'issuer', label: 'Issuer' }] : []),
    { id: 'raw', label: 'JSON' },
  ]
  const [active, setActive] = useState(tabs[0].id)

  return (
    <TabShell tabs={tabs} active={active} onSelect={setActive}>
      {active === 'assertion' && <KeyValueTable obj={badge.assertion as unknown as Record<string, unknown>} />}
      {active === 'badgeclass' && badge.badgeClass && (
        <KeyValueTable obj={badge.badgeClass as unknown as Record<string, unknown>} />
      )}
      {active === 'issuer' && badge.issuer && (
        <KeyValueTable obj={badge.issuer as unknown as Record<string, unknown>} />
      )}
      {active === 'raw' && <JsonViewer data={badge.raw} />}
    </TabShell>
  )
}

// ---- v3.0 ----

function V3Tabs({ badge }: { badge: NormalizedBadgeV3 }) {
  const tabs = [
    { id: 'credential', label: 'Credential' },
    ...(badge.achievement ? [{ id: 'achievement', label: 'Achievement' }] : []),
    ...(badge.issuer ? [{ id: 'issuer', label: 'Issuer' }] : []),
    ...(badge.credential.proof ? [{ id: 'proof', label: 'Proof' }] : []),
    { id: 'raw', label: 'JSON' },
  ]
  const [active, setActive] = useState(tabs[0].id)

  return (
    <TabShell tabs={tabs} active={active} onSelect={setActive}>
      {active === 'credential' && (
        <KeyValueTable obj={badge.credential as unknown as Record<string, unknown>} />
      )}
      {active === 'achievement' && badge.achievement && (
        <KeyValueTable obj={badge.achievement as unknown as Record<string, unknown>} />
      )}
      {active === 'issuer' && badge.issuer && (
        <KeyValueTable obj={badge.issuer as unknown as Record<string, unknown>} />
      )}
      {active === 'proof' && badge.credential.proof && (
        <KeyValueTable obj={
          Array.isArray(badge.credential.proof)
            ? { proofs: badge.credential.proof }
            : badge.credential.proof as unknown as Record<string, unknown>
        } />
      )}
      {active === 'raw' && <JsonViewer data={badge.raw} />}
    </TabShell>
  )
}

// ---- Shared UI ----

interface Tab { id: string; label: string }

function TabShell({
  tabs,
  active,
  onSelect,
  children,
}: {
  tabs: Tab[]
  active: string
  onSelect: (id: string) => void
  children: React.ReactNode
}) {
  const { t } = useLocale()
  const panelId = (id: string) => `tabpanel-${id}`
  const tabId = (id: string) => `tab-${id}`
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (index + 1) % tabs.length
      onSelect(tabs[next].id)
      tabRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (index - 1 + tabs.length) % tabs.length
      onSelect(tabs[prev].id)
      tabRefs.current[prev]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      onSelect(tabs[0].id)
      tabRefs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      onSelect(tabs[tabs.length - 1].id)
      tabRefs.current[tabs.length - 1]?.focus()
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label={t('tabs.label')}
        className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={panelId(tab.id)}
            tabIndex={active === tab.id ? 0 : -1}
            ref={(el) => { tabRefs.current[index] = el }}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset',
              active === tab.id
                ? 'border-violet-600 text-violet-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        id={panelId(active)}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="p-5 focus:outline-none"
      >
        {children}
      </div>
    </div>
  )
}

function KeyValueTable({ obj }: { obj: Record<string, unknown> }) {
  const { t } = useLocale()
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">{t('tabs.empty')}</p>
  }

  return (
    <dl className="divide-y divide-gray-100">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[180px_1fr] gap-3 py-2.5 text-sm">
          <dt className="font-mono text-xs font-medium text-gray-500 self-start pt-0.5 break-all">
            {key}
          </dt>
          <dd className="text-gray-900 break-all">
            <CellValue value={value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>
  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
        {String(value)}
      </span>
    )
  }
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noreferrer noopener"
          className="text-violet-700 hover:underline break-all"
        >
          {value}
        </a>
      )
    }
    return <span>{value}</span>
  }
  if (typeof value === 'object') {
    return (
      <pre className="rounded bg-gray-50 p-2 text-xs font-mono overflow-auto max-h-40 border border-gray-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  return <span>{String(value)}</span>
}
