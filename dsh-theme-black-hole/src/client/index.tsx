import type { BoundActions } from '@deepseek-ai/dsh-client-store'
import { BlackHoleBackgroundController } from './background-controller.ts'
import { createRenderer } from './black-hole/renderer.ts'
import { dictionaries, SETTINGS_NS } from './locales.ts'
import { installStyles } from './styles.ts'
import { BlackHoleAppearanceRow } from './BlackHoleAppearanceRow.tsx'
import type { AppearanceThemeId } from './appearance-theme-ids.ts'
import { createBlackHoleThemeStore } from './black-hole-theme-store.ts'
import { BLACK_HOLE_THEME, BLACK_HOLE_THEME_ID } from './theme.ts'
import {
  BLACK_HOLE_SETTINGS_NAMESPACE, BLACK_HOLE_SETTINGS_THEME_FIELD, type BlackHoleThemeSettings,
} from '../black-hole-settings.ts'

declare const module: { exports: Record<string, unknown> }
declare const exports: Record<string, unknown>

interface ThemeSnapshot {
  preference: string
  active: { id: string }
  revision: number
}

interface ThemeService {
  getTheme(): ThemeSnapshot
  register(definition: typeof BLACK_HOLE_THEME): () => void
  setTheme(id: string): void
}

interface SettingsScope<T> {
  getSnapshot(): {
    status: 'loading' | 'ready' | 'unavailable'
    value: T | undefined
    writable: boolean
  }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

interface ClientContext {
  theme: ThemeService
  locale: {
    register(namespace: string, values: typeof dictionaries): () => void
  }
  settingsScope: {
    bind<T>(spec: { namespace: string }): SettingsScope<T>
  }
  slots: {
    inject(name: string, setup: () => unknown): void
    register(options: Record<string, unknown>, component: unknown): () => void
  }
  effect(setup: () => void | (() => void), label?: string): void
  on(event: 'theme/change', listener: (snapshot: ThemeSnapshot) => void): () => void
}

/** Required browser services. */
export const inject = ['theme', 'slots', 'locale', 'settingsScope']

/** Register the theme, selector row, and theme-bound Hero background. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.theme.register(BLACK_HOLE_THEME), 'dsh-theme-black-hole: black-hole theme')
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, dictionaries), 'dsh-theme-black-hole: dictionaries')
  ctx.effect(() => installStyles(), 'dsh-theme-black-hole: styles')

  const background = new BlackHoleBackgroundController(document, window, createRenderer)
  ctx.effect(() => {
    background.start()
    return () => { background.dispose() }
  }, 'dsh-theme-black-hole: black-hole background')

  const store = createBlackHoleThemeStore()
  const settings = ctx.settingsScope.bind<BlackHoleThemeSettings>({
    namespace: BLACK_HOLE_SETTINGS_NAMESPACE,
  })
  let bound: BoundActions<typeof store> | undefined
  let pendingSelection: 'off' | typeof BLACK_HOLE_THEME_ID | undefined
  let settingsWriteInFlight = false
  let applyingSettings = false
  let reapplyQueued = false
  const persistPendingSelection = (): void => {
    if (pendingSelection === undefined || settingsWriteInFlight) return
    const current = settings.getSnapshot()
    if (current.value?.theme === pendingSelection) {
      pendingSelection = undefined
      return
    }
    if (current.status !== 'ready' || !current.writable) return
    const selection = pendingSelection
    let writeSucceeded = true
    settingsWriteInFlight = true
    void settings.set(BLACK_HOLE_SETTINGS_THEME_FIELD, selection)
      .catch((error: unknown) => {
        writeSucceeded = false
        console.error('dsh-theme-black-hole: failed to persist theme preference', error)
      })
      .finally(() => {
        settingsWriteInFlight = false
        if (writeSucceeded) persistPendingSelection()
      })
  }
  const adopt = (snapshot: ThemeSnapshot): void => {
    bound?.sync(snapshot.preference, snapshot.revision)
    background.setThemeActive(snapshot.active.id === BLACK_HOLE_THEME_ID)
    if (snapshot.active.id === BLACK_HOLE_THEME_ID
      || applyingSettings
      || pendingSelection !== undefined
      || settings.getSnapshot().value?.theme !== BLACK_HOLE_THEME_ID
      || reapplyQueued) return
    reapplyQueued = true
    queueMicrotask(() => {
      reapplyQueued = false
      if (pendingSelection !== undefined
        || settings.getSnapshot().value?.theme !== BLACK_HOLE_THEME_ID
        || ctx.theme.getTheme().active.id === BLACK_HOLE_THEME_ID) return
      applyingSettings = true
      try {
        ctx.theme.setTheme(BLACK_HOLE_THEME_ID)
      } finally {
        applyingSettings = false
      }
    })
  }
  ctx.on('theme/change', adopt)

  const adoptSettings = (): void => {
    const desired = settings.getSnapshot().value?.theme
    if (pendingSelection !== undefined) {
      persistPendingSelection()
      if (pendingSelection !== undefined) return
    }
    const active = ctx.theme.getTheme().preference
    applyingSettings = true
    try {
      if (desired === BLACK_HOLE_THEME_ID && active !== BLACK_HOLE_THEME_ID) {
        ctx.theme.setTheme(BLACK_HOLE_THEME_ID)
      } else if (desired !== BLACK_HOLE_THEME_ID && active === BLACK_HOLE_THEME_ID) {
        ctx.theme.setTheme('dark')
      }
    } finally {
      applyingSettings = false
    }
  }
  ctx.effect(() => settings.subscribe(adoptSettings), 'dsh-theme-black-hole: durable theme preference')
  adoptSettings()
  adopt(ctx.theme.getTheme())

  const injected = (actions: BoundActions<typeof store>) => {
    bound = actions
    adopt(ctx.theme.getTheme())
    return {
      setTheme: (id: AppearanceThemeId) => {
        const selection = id === BLACK_HOLE_THEME_ID ? BLACK_HOLE_THEME_ID : 'off'
        pendingSelection = selection
        ctx.theme.setTheme(id)
        persistPendingSelection()
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'appearance',
    order: 10,
    priority: -10,
    locale: SETTINGS_NS,
    store,
    inject: injected,
  }, BlackHoleAppearanceRow))
}

Object.assign(exports, { apply, inject })
void module
