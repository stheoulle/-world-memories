import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, initialLang, STORAGE_KEY, type Lang } from './context'
import { en } from './en'
import { fr } from './fr'

const MESSAGES = { en, fr }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      t: MESSAGES[lang],
      setLang: (next: Lang) => {
        localStorage.setItem(STORAGE_KEY, next)
        setLangState(next)
      },
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
