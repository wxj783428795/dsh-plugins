import { expect, test } from '@playwright/test'

const targetUrl = process.env.DSH_PERF_URL

test.skip(!targetUrl, '需要通过 DSH_PERF_URL 指定已启用黑洞主题的 DSH Web 地址')

test.use({
  channel: 'chrome',
  viewport: { width: 1440, height: 900 },
})

test('侧边栏动画期间不应反复重建 WebGPU 中间纹理', async ({ page }) => {
  await page.goto(targetUrl!)
  const layer = page.locator('[data-dsh-black-hole-background][data-mode="ready"]')
  await expect(layer).toBeVisible({ timeout: 15_000 })

  const configureLater = page.getByRole('button', { name: /稍后配置|Configure later/ })
  if (await configureLater.isVisible()) await configureLater.click()

  const canvas = layer.locator('canvas')
  const toggle = page.getByRole('button', {
    name: /收起侧边栏|展开侧边栏|Collapse sidebar|Expand sidebar/,
  })
  await expect(toggle).toBeVisible()
  await expect(layer).toHaveAttribute('data-target-resizes', /\d+/)
  const targetResizesBefore = Number(await layer.getAttribute('data-target-resizes'))

  const measurement = page.evaluate(async () => {
    const target = document.querySelector<HTMLCanvasElement>('[data-dsh-black-hole-background] canvas')
    if (!target) throw new Error('找不到黑洞主题画布')

    const frameDurations: number[] = []
    const backingSizes = new Set<string>([`${target.width}x${target.height}`])
    let previousFrame: number | undefined
    const startedAt = performance.now()

    await new Promise<void>((resolve) => {
      const sample = (now: number) => {
        if (previousFrame !== undefined) frameDurations.push(now - previousFrame)
        previousFrame = now
        backingSizes.add(`${target.width}x${target.height}`)

        if (now - startedAt < 800) requestAnimationFrame(sample)
        else resolve()
      }

      requestAnimationFrame(sample)
    })

    const sorted = [...frameDurations].sort((left, right) => left - right)
    return {
      backingSizeCount: backingSizes.size,
      finalBackingSize: `${target.width}x${target.height}`,
      maxFrameMs: Math.max(...frameDurations),
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
    }
  })

  await toggle.click({ force: true })
  const result = await measurement
  const targetResizesAfter = Number(await layer.getAttribute('data-target-resizes'))
  const targetResizeDelta = targetResizesAfter - targetResizesBefore
  const finalTargetSize = await layer.getAttribute('data-target-size')
  console.log(JSON.stringify({ ...result, targetResizeDelta, finalTargetSize }))

  expect(targetResizeDelta).toBeLessThanOrEqual(1)
  expect(finalTargetSize).toBe(result.finalBackingSize)
})
