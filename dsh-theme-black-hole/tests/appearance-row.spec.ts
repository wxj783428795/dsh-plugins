import { describe, expect, it } from 'vitest'
import { APPEARANCE_THEME_IDS } from '../src/client/appearance-theme-ids.ts'
import { createBlackHoleThemeStore } from '../src/client/black-hole-theme-store.ts'

describe('Black Hole Appearance row', () => {
  it('presents the built-in preferences and Black Hole as one choice set', () => {
    expect(APPEARANCE_THEME_IDS).toEqual(['light', 'dark', 'wxj-black-hole', 'system'])
  })

  it('tracks the preference rather than the resolved active theme', () => {
    const instance = createBlackHoleThemeStore().create()
    instance.actions.sync('system', 4)

    expect(instance.getSnapshot()).toMatchObject({ preference: 'system', revision: 4 })
  })
})
