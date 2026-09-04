export const TARGET_FPS = 60

const FRAME_INTERVAL_MS = 1000 / TARGET_FPS
const FRAME_PACING_EPSILON_MS = 0.25

/**
 * Converts the display's requestAnimationFrame cadence into a stable 60 FPS
 * presentation budget. Keeping the fractional remainder avoids the 48 FPS
 * cadence produced by a simple threshold on 144 Hz displays.
 */
export class FramePacer {
  private lastTickAt: number | undefined
  private budgetMs = 0

  shouldPresent(timestamp: number): boolean {
    if (this.lastTickAt === undefined) {
      this.lastTickAt = timestamp
      return true
    }

    const elapsed = Math.min(Math.max(timestamp - this.lastTickAt, 0), FRAME_INTERVAL_MS * 2)
    this.lastTickAt = timestamp
    this.budgetMs = Math.min(this.budgetMs + elapsed, FRAME_INTERVAL_MS * 2)
    if (this.budgetMs + FRAME_PACING_EPSILON_MS < FRAME_INTERVAL_MS) return false

    this.budgetMs = Math.max(0, this.budgetMs - FRAME_INTERVAL_MS)
    return true
  }
}
