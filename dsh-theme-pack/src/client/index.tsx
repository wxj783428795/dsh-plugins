import type { BoundActions } from '@deepseek-ai/dsh-client-store'
import { BlackHoleBackgroundController } from './background-controller.ts'
import { createRenderer } from './black-hole/renderer.ts'
import { dictionaries, SETTINGS_NS } from './locales.ts'
import { installStyles } from './styles.ts'
import { ThemePackRow } from './ThemePackRow.tsx'
import { createThemePackStore } from './theme-store.ts'
import { BLACK_HOLE_THEME, BLACK_HOLE_THEME_ID } from './theme.ts'
import {
  THEME_PACK_SETTINGS_NAMESPACE, THEME_PACK_THEME_FIELD, type ThemePackSettings,
} from '../theme-settings.ts'

declare const module: { exports: Record<string, unknown> }
declare const exports: Record<string, unknown>

interface ThemeSnapshot {
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
  ctx.effect(() => ctx.theme.register(BLACK_HOLE_THEME), 'dsh-theme-pack: black-hole theme')
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, dictionaries), 'dsh-theme-pack: dictionaries')
  ctx.effect(() => installStyles(), 'dsh-theme-pack: styles')

  const background = new BlackHoleBackgroundController(document, window, createRenderer)
  ctx.effect(() => {
    background.start()
    return () => { background.dispose() }
  }, 'dsh-theme-pack: black-hole background')

  const store = createThemePackStore()
  const settings = ctx.settingsScope.bind<ThemePackSettings>({
    namespace: THEME_PACK_SETTINGS_NAMESPACE,
  })
  let bound: BoundActions<typeof store> | undefined
  let pendingSelection: 'dark' | typeof BLACK_HOLE_THEME_ID | undefined
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
    void settings.set(THEME_PACK_THEME_FIELD, selection)
      .catch(() => { writeSucceeded = false })
      .finally(() => {
        settingsWriteInFlight = false
        if (writeSucceeded) persistPendingSelection()
      })
  }
  const adopt = (snapshot: ThemeSnapshot): void => {
    bound?.sync(snapshot.active.id, snapshot.revision)
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
    const active = ctx.theme.getTheme().active.id
    applyingSettings = true
    try {
      if (desired === BLACK_HOLE_THEME_ID && active !== BLACK_HOLE_THEME_ID) {
        ctx.theme.setTheme(BLACK_HOLE_THEME_ID)
      } else if (desired === 'dark' && active === BLACK_HOLE_THEME_ID) {
        ctx.theme.setTheme('dark')
      }
    } finally {
      applyingSettings = false
    }
  }
  ctx.effect(() => settings.subscribe(adoptSettings), 'dsh-theme-pack: durable theme preference')
  adoptSettings()
  adopt(ctx.theme.getTheme())

  const injected = (actions: BoundActions<typeof store>) => {
    bound = actions
    adopt(ctx.theme.getTheme())
    return {
      setTheme: (id: string) => {
        const selection = id === BLACK_HOLE_THEME_ID ? BLACK_HOLE_THEME_ID : 'dark'
        pendingSelection = selection
        ctx.theme.setTheme(selection)
        persistPendingSelection()
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'wxj-theme-pack',
    order: 12,
    locale: SETTINGS_NS,
    store,
    inject: injected,
  }, ThemePackRow))
}

Object.assign(exports, { apply, inject })
void module
