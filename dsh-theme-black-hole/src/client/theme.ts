import { BLACK_HOLE_THEME_ID } from '../black-hole-settings.ts'

export { BLACK_HOLE_THEME_ID } from '../black-hole-settings.ts'

/** Black Hole uses DSH Dark verbatim; the visual lives only in the Hero background layer. */
export const BLACK_HOLE_THEME = Object.freeze({
  id: BLACK_HOLE_THEME_ID,
  colorScheme: 'dark' as const,
  tokens: Object.freeze({}),
})
