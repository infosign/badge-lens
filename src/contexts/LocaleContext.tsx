import { createContext, useContext, useMemo } from 'react'
import { detectLocale, createT, type Locale } from '../lib/i18n'

interface LocaleContextValue {
  locale: Locale
  t: ReturnType<typeof createT>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useMemo(() => detectLocale(), [])
  const t = useMemo(() => createT(locale), [locale])
  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
