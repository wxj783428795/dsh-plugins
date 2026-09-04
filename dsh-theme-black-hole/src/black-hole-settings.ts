import z from '@deepseek-ai/schemastery'

export const BLACK_HOLE_THEME_ID = 'wxj-black-hole'
export const BLACK_HOLE_SETTINGS_NAMESPACE = 'wxj-theme-black-hole'
export const BLACK_HOLE_SETTINGS_THEME_FIELD = 'theme'
export const BLACK_HOLE_SETTINGS_THEME_IDS = ['off', 'dark', BLACK_HOLE_THEME_ID] as const

export type BlackHoleThemeSelection = typeof BLACK_HOLE_SETTINGS_THEME_IDS[number]

export interface BlackHoleThemeSettings {
  theme: BlackHoleThemeSelection
}

export const BlackHoleThemeSettingsSchema: z<BlackHoleThemeSettings> = z.object({
  // Keep the former `dark` value readable so existing installations migrate
  // without rejecting their profile. Both `off` and legacy `dark` mean that
  // the built-in Appearance preference owns the selection.
  [BLACK_HOLE_SETTINGS_THEME_FIELD]: z.union([...BLACK_HOLE_SETTINGS_THEME_IDS]).default('off'),
})
