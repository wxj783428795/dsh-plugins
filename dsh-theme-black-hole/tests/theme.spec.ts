import { describe, expect, it } from 'vitest'
import {
  BLACK_HOLE_THEME, BLACK_HOLE_THEME_ID,
} from '../src/client/theme.ts'
import {
  BLACK_HOLE_SETTINGS_NAMESPACE, BLACK_HOLE_SETTINGS_THEME_FIELD, BLACK_HOLE_SETTINGS_THEME_IDS,
  BlackHoleThemeSettingsSchema, type BlackHoleThemeSettings,
} from '../src/black-hole-settings.ts'

describe('Black Hole theme', () => {
  it('uses the DSH dark palette without overriding global UI tokens', () => {
    expect(BLACK_HOLE_THEME).toMatchObject({
      id: BLACK_HOLE_THEME_ID,
      colorScheme: 'dark',
    })
    expect(BLACK_HOLE_THEME.tokens).toEqual({})
  })

  it('declares a durable DSH setting for the optional custom theme', () => {
    expect(BLACK_HOLE_SETTINGS_NAMESPACE).toBe('wxj-theme-black-hole')
    expect(BLACK_HOLE_SETTINGS_THEME_FIELD).toBe('theme')
    expect(BLACK_HOLE_SETTINGS_THEME_IDS).toEqual(['off', 'dark', BLACK_HOLE_THEME_ID])
    expect(BlackHoleThemeSettingsSchema({} as BlackHoleThemeSettings)).toEqual({ theme: 'off' })
    expect(BlackHoleThemeSettingsSchema({ theme: 'dark' })).toEqual({ theme: 'dark' })
    expect(BlackHoleThemeSettingsSchema({ theme: BLACK_HOLE_THEME_ID })).toEqual({
      theme: BLACK_HOLE_THEME_ID,
    })
  })
})
