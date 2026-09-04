import { describe, expect, it } from 'vitest'
import {
  BLACK_HOLE_THEME, BLACK_HOLE_THEME_ID,
} from '../src/client/theme.ts'
import {
  THEME_PACK_SETTINGS_NAMESPACE, THEME_PACK_THEME_FIELD, THEME_PACK_THEME_IDS,
  ThemePackSettingsSchema, type ThemePackSettings,
} from '../src/theme-settings.ts'

describe('Black Hole theme', () => {
  it('inherits the DSH dark palette and limits itself to alias overrides', () => {
    expect(BLACK_HOLE_THEME).toMatchObject({
      id: BLACK_HOLE_THEME_ID,
      colorScheme: 'dark',
    })
    expect(Object.keys(BLACK_HOLE_THEME.tokens)).not.toHaveLength(0)
    expect(Object.keys(BLACK_HOLE_THEME.tokens).every(name => name.startsWith('--dsw-'))).toBe(true)
  })

  it('declares a durable DSH settings section for the selectable themes', () => {
    expect(THEME_PACK_SETTINGS_NAMESPACE).toBe('wxj-theme-pack')
    expect(THEME_PACK_THEME_FIELD).toBe('theme')
    expect(THEME_PACK_THEME_IDS).toEqual(['dark', BLACK_HOLE_THEME_ID])
    expect(ThemePackSettingsSchema({} as ThemePackSettings)).toEqual({ theme: 'dark' })
    expect(ThemePackSettingsSchema({ theme: BLACK_HOLE_THEME_ID })).toEqual({
      theme: BLACK_HOLE_THEME_ID,
    })
  })
})
