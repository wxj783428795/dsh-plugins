import { BLACK_HOLE_THEME_ID } from '../theme-settings.ts'

export { BLACK_HOLE_THEME_ID } from '../theme-settings.ts'

/** Black Hole inherits Dark and changes only the aliases needed by the visual. */
export const BLACK_HOLE_THEME = Object.freeze({
  id: BLACK_HOLE_THEME_ID,
  colorScheme: 'dark' as const,
  tokens: Object.freeze({
    '--dsw-alias-bg-base': '#05070d',
    '--dsw-alias-bg-layer-1': '#0b0f19',
    '--dsw-alias-bg-layer-2': '#101725',
    '--dsw-alias-bg-overlay': '#0b101bcc',
    '--dsw-alias-border-l1': '#9eb5df1a',
    '--dsw-alias-border-l2': '#9eb5df2e',
    '--dsw-alias-brand-primary': '#c5d3ff',
    '--dsw-alias-label-primary': '#f3f6ff',
    '--dsw-alias-label-secondary': '#aeb9d0',
    '--dsw-specific-sidebar-fill': '#070a11',
  }),
})
