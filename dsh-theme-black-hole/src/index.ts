/** Host registration for the Black Hole theme's durable preference. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import { BLACK_HOLE_SETTINGS_NAMESPACE, BlackHoleThemeSettingsSchema } from './black-hole-settings.ts'

export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(BLACK_HOLE_SETTINGS_NAMESPACE, BlackHoleThemeSettingsSchema)
  })
}
