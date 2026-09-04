import { BLACK_HOLE_THEME_ID } from './theme.ts'

export const APPEARANCE_THEME_IDS = ['light', 'dark', BLACK_HOLE_THEME_ID, 'system'] as const

export type AppearanceThemeId = typeof APPEARANCE_THEME_IDS[number]
