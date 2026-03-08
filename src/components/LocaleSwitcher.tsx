// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { Button } from '#/components/ui/button'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        color: 'inherit',
      }}
      aria-label={m.language_label()}
    >
      <span style={{ opacity: 0.85 }}>
        {m.current_locale({ locale: currentLocale })}
      </span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {locales.map((locale) => (
          <Button
            key={locale}
            variant={locale === currentLocale ? "zine" : "ghost"}
            size="sm"
            onClick={() => setLocale(locale)}
            aria-pressed={locale === currentLocale}
            className="rounded-full font-black"
          >
            {locale.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
}
