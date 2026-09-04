import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'

/** Settings-row state mirrored from DSH's Theme service. */
export interface BlackHoleThemeState {
  preference: string
  revision: number
}

type BlackHoleThemeActions = {
  sync: (draft: BlackHoleThemeState, preference: string, revision: number) => void
}

/** Create the settings-row store. */
export function createBlackHoleThemeStore(): EngineStoreHandle<BlackHoleThemeState, BlackHoleThemeActions> {
  return defineStore({
    init: (): BlackHoleThemeState => ({ preference: 'system', revision: -1 }),
    actions: {
      sync: (draft, preference, revision) => {
        if (revision <= draft.revision) return
        draft.preference = preference
        draft.revision = revision
      },
    },
  })
}
