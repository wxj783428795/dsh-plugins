import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const targetUrl = process.env.DSH_PERF_URL
const heroScreenshot = fileURLToPath(new URL('../assets/black-hole-hero.png', import.meta.url))

test.skip(!targetUrl, '需要通过 DSH_PERF_URL 指定已启用黑洞主题的 DSH Web 地址')

test.use({
  channel: 'chrome',
  viewport: { width: 1440, height: 900 },
})

test('截取无遮挡的黑洞主题 Hero 效果图', async ({ page }) => {
  await page.goto(targetUrl!)

  const configureLater = page.getByRole('button', { name: /稍后配置|Configure later/ })
  await configureLater.waitFor({ state: 'visible', timeout: 2_500 }).catch(() => {})
  if (await configureLater.isVisible()) await configureLater.click()

  const layer = page.locator('[data-dsh-black-hole-background][data-mode="ready"]')
  await expect(layer).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  await page.waitForTimeout(800)

  mkdirSync(dirname(heroScreenshot), { recursive: true })
  await page.screenshot({ path: heroScreenshot, fullPage: false })
})
