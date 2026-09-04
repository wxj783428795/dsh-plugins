import type { ThemePackState } from './theme-store.ts'
import { BLACK_HOLE_THEME_ID } from './theme.ts'

interface ThemePackRowProps {
  t: (key: string) => string
  setTheme: (id: string) => void
  useStore: <Selected>(selector: (state: ThemePackState) => Selected) => Selected
}

const THEMES = [
  { id: 'dark', label: 'theme.dark', className: 'dsh-theme-pack-swatch-dark' },
  { id: BLACK_HOLE_THEME_ID, label: 'theme.blackHole', className: 'dsh-theme-pack-swatch-black-hole' },
] as const

/** Theme chooser shown in Settings → General. */
export function ThemePackRow({ t, setTheme, useStore }: ThemePackRowProps) {
  const activeId = useStore(state => state.activeId)
  return (
    <section className="dsh-theme-pack-row">
      <div className="dsh-theme-pack-title">{t('title')}</div>
      <div className="dsh-theme-pack-options">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            type="button"
            className="dsh-theme-pack-option"
            aria-pressed={activeId === theme.id}
            onClick={() => { setTheme(theme.id) }}
          >
            <span className={`dsh-theme-pack-swatch ${theme.className}`} aria-hidden="true" />
            <span>{t(theme.label)}</span>
          </button>
        ))}
      </div>
      <p className="dsh-theme-pack-hint">{t('hint')}</p>
    </section>
  )
}

