// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BlackHoleBackgroundController, isBlackHoleBackgroundEligible,
} from '../src/client/background-controller.ts'

function media(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

function installMedia(wide: boolean, reduced: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => media(query.includes('min-width') ? wide : reduced),
  })
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('black-hole background eligibility', () => {
  it('requires the custom theme, Hero phase, desktop, motion, and WebGPU', () => {
    expect(isBlackHoleBackgroundEligible({
      themeActive: true,
      phase: 'hero',
      wideScreen: true,
      reducedMotion: false,
      webGpu: true,
    })).toBe(true)
    expect(isBlackHoleBackgroundEligible({
      themeActive: true,
      phase: 'active',
      wideScreen: true,
      reducedMotion: false,
      webGpu: true,
    })).toBe(false)
    expect(isBlackHoleBackgroundEligible({
      themeActive: true,
      phase: 'hero',
      wideScreen: true,
      reducedMotion: true,
      webGpu: true,
    })).toBe(false)
  })
})

describe('BlackHoleBackgroundController', () => {
  it('mounts for Hero and releases the renderer when the conversation activates', async () => {
    installMedia(true, false)
    Object.defineProperty(window.navigator, 'gpu', { configurable: true, value: {} })
    document.body.innerHTML = '<div data-slot="conversation"><main data-phase="hero"></main></div>'
    const dispose = vi.fn()
    const factory = vi.fn(() => ({ ready: Promise.resolve(), dispose }))
    const controller = new BlackHoleBackgroundController(document, window, factory)

    controller.start()
    controller.setThemeActive(true)
    await flush()

    const root = document.querySelector<HTMLElement>('[data-phase]')!
    expect(root.hasAttribute('data-dsh-black-hole-root')).toBe(true)
    expect(root.querySelector('[data-dsh-black-hole-background]')).not.toBeNull()
    expect(factory).toHaveBeenCalledOnce()

    root.dataset.phase = 'active'
    await flush()
    expect(dispose).toHaveBeenCalledOnce()
    expect(root.querySelector('[data-dsh-black-hole-background]')).toBeNull()

    controller.dispose()
  })

  it('keeps the static fallback when reduced motion is requested', async () => {
    installMedia(true, true)
    Object.defineProperty(window.navigator, 'gpu', { configurable: true, value: {} })
    document.body.innerHTML = '<div data-slot="conversation"><main data-phase="hero"></main></div>'
    const factory = vi.fn(() => ({ ready: Promise.resolve(), dispose: vi.fn() }))
    const controller = new BlackHoleBackgroundController(document, window, factory)

    controller.start()
    controller.setThemeActive(true)
    await flush()

    expect(document.querySelector('[data-dsh-black-hole-background]')?.getAttribute('data-mode')).toBe('static')
    expect(factory).not.toHaveBeenCalled()
    controller.dispose()
  })
})

