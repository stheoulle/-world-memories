import { LANGS, useI18n, type Lang } from './context'

/** Each language named in itself, as language pickers usually do. */
const NATIVE_NAMES: Record<Lang, string> = { en: 'English', fr: 'Français' }

/** FR / EN switch (spec §4.8). */
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="lang-toggle" role="group" aria-label={t.languageLabel}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className="lang-toggle-option"
          aria-pressed={code === lang}
          aria-label={NATIVE_NAMES[code]}
          title={NATIVE_NAMES[code]}
          lang={code}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
