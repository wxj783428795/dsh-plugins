/** Host registration for the theme pack's durable preference. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import { THEME_PACK_SETTINGS_NAMESPACE, ThemePackSettingsSchema } from './theme-settings.ts'

export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(THEME_PACK_SETTINGS_NAMESPACE, ThemePackSettingsSchema)
  })
}
