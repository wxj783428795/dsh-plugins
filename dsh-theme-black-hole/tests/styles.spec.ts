// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { installStyles } from '../src/client/styles.ts'

afterEach(() => {
  document.head.querySelectorAll('style[data-plugin-css]').forEach(element => { element.remove() })
})

describe('black-hole background styles', () => {
  it('keeps the loading and fallback background neutral instead of drawing a second black hole', () => {
    const dispose = installStyles(document)
    const css = document.head.querySelector<HTMLStyleElement>('style[data-plugin-css]')?.textContent ?? ''

    expect(css).toMatch(/\.dsh-black-hole-background\{[^}]*background:#020309/)
    expect(css).not.toMatch(/\.dsh-black-hole-background\{[^}]*background:[^}]*radial-gradient/)

    dispose()
  })
})
