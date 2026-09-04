import z from '@deepseek-ai/schemastery'

export const BLACK_HOLE_THEME_ID = 'wxj-black-hole'
export const THEME_PACK_SETTINGS_NAMESPACE = 'wxj-theme-pack'
export const THEME_PACK_THEME_FIELD = 'theme'
export const THEME_PACK_THEME_IDS = ['dark', BLACK_HOLE_THEME_ID] as const

export type ThemePackThemeId = typeof THEME_PACK_THEME_IDS[number]

export interface ThemePackSettings {
  theme: ThemePackThemeId
}

export const ThemePackSettingsSchema: z<ThemePackSettings> = z.object({
  [THEME_PACK_THEME_FIELD]: z.union([...THEME_PACK_THEME_IDS]).default('dark'),
})
