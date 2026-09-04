import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'

/** Settings-row state mirrored from DSH's Theme service. */
export interface ThemePackState {
  activeId: string
  revision: number
}

type ThemePackActions = {
  sync: (draft: ThemePackState, activeId: string, revision: number) => void
}

/** Create the settings-row store. */
export function createThemePackStore(): EngineStoreHandle<ThemePackState, ThemePackActions> {
  return defineStore({
    init: (): ThemePackState => ({ activeId: 'dark', revision: -1 }),
    actions: {
      sync: (draft, activeId, revision) => {
        if (revision <= draft.revision) return
        draft.activeId = activeId
        draft.revision = revision
      },
    },
  })
}

