import { createContext, useContext } from 'react'
import { en, type Messages } from './en'

export type Lang = 'en' | 'fr'

export const LANGS: Lang[] = ['en', 'fr']

export type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Messages
}

export const STORAGE_KEY = 'world-memories.lang'

/** Saved choice, else the browser language: French if it starts with "fr", English otherwise (spec §4.8). */
export function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'fr') return saved
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, t: en })

export function useI18n(): I18n {
  return useContext(I18nContext)
}
