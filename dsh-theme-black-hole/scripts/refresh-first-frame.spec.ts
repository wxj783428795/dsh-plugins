import { expect, test } from '@playwright/test'

const targetUrl = process.env.DSH_PERF_URL

test.skip(!targetUrl, '需要通过 DSH_PERF_URL 指定已启用黑洞主题的 DSH Web 地址')

test.use({
  channel: 'chrome',
  viewport: { width: 1440, height: 900 },
})

test('刷新时动态黑洞之前只显示纯深色背景', async ({ page }) => {
  await page.addInitScript(() => {
    const loadingBackgrounds: string[] = []
    Object.assign(window, { __blackHoleLoadingBackgrounds: loadingBackgrounds })

    new MutationObserver(() => {
      const layer = document.querySelector<HTMLElement>(
        '[data-dsh-black-hole-background][data-mode="loading"]',
      )
      if (layer !== null) loadingBackgrounds.push(getComputedStyle(layer).backgroundImage)
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-mode'],
    })
  })

  await page.goto(targetUrl!)
  await expect(page.locator('[data-dsh-black-hole-background][data-mode="ready"]'))
    .toBeVisible({ timeout: 15_000 })

  const backgrounds = await page.evaluate(() => (
    window as typeof window & { __blackHoleLoadingBackgrounds: string[] }
  ).__blackHoleLoadingBackgrounds)
  expect(backgrounds.length).toBeGreaterThan(0)
  expect(backgrounds).not.toContain(expect.stringContaining('radial-gradient'))
})
