import { describe, expect, it } from 'vitest'
import { FramePacer } from '../src/client/black-hole/frame-pacer.ts'

function sampledFps(displayHz: number, durationSeconds = 10): number {
  const pacer = new FramePacer()
  const tickInterval = 1000 / displayHz
  const ticks = Math.round(displayHz * durationSeconds)
  let presented = 0
  for (let index = 0; index <= ticks; index += 1) {
    if (pacer.shouldPresent(index * tickInterval)) presented += 1
  }
  return (presented - 1) / durationSeconds
}

describe('FramePacer', () => {
  it.each([60, 120, 144, 165])('holds an average 60 FPS on a %i Hz display', (displayHz) => {
    expect(sampledFps(displayHz)).toBeCloseTo(60, 0)
  })

  it('presents every available frame below the target refresh rate', () => {
    expect(sampledFps(30)).toBeCloseTo(30, 0)
  })
})
