import type { BlackHoleThemeState } from './black-hole-theme-store.ts'
import {
  IconDarkOutline16, IconFollowsystemOutline16, IconLightOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { BLACK_HOLE_THEME_ID } from './theme.ts'
import { APPEARANCE_THEME_IDS, type AppearanceThemeId } from './appearance-theme-ids.ts'

interface BlackHoleAppearanceRowProps {
  t: (key: string) => string
  setTheme: (id: AppearanceThemeId) => void
  useStore: <Selected>(selector: (state: BlackHoleThemeState) => Selected) => Selected
}

function BlackHoleIcon() {
  return <span className="dsh-theme-black-hole-icon" aria-hidden="true" />
}

const THEME_DETAILS = {
  light: { label: 'appearance.light', Icon: IconLightOutline16 },
  dark: { label: 'appearance.dark', Icon: IconDarkOutline16 },
  [BLACK_HOLE_THEME_ID]: { label: 'appearance.blackHole', Icon: BlackHoleIcon },
  system: { label: 'appearance.system', Icon: IconFollowsystemOutline16 },
} as const

const THEMES = APPEARANCE_THEME_IDS.map(id => ({ id, ...THEME_DETAILS[id] }))

/** Unified Appearance chooser that shadows DSH's built-in three-card row. */
export function BlackHoleAppearanceRow({ t, setTheme, useStore }: BlackHoleAppearanceRowProps) {
  const preference = useStore(state => state.preference)
  return (
    <section className="dsh-theme-black-hole-appearance">
      <div className="dsh-theme-black-hole-appearance-title">{t('appearance.title')}</div>
      <div
        className="dsh-theme-black-hole-cubes"
        role="radiogroup"
        aria-label={t('appearance.title')}
      >
        {THEMES.map(({ id, label, Icon }, index) => (
          <button
            key={id}
            type="button"
            className="dsh-theme-black-hole-cube"
            role="radio"
            aria-checked={preference === id}
            tabIndex={preference === id ? 0 : -1}
            onClick={() => { setTheme(id) }}
            onKeyDown={(event) => {
              const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
              if (direction === 0) return
              event.preventDefault()
              const nextIndex = (index + direction + THEMES.length) % THEMES.length
              const next = THEMES[nextIndex]
              if (next === undefined) return
              setTheme(next.id)
              const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
              buttons?.[nextIndex]?.focus()
            }}
          >
            <Icon />
            <span>{t(label)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
