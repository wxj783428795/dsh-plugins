import type {
  BlackHoleRenderer,
  RendererFrameSample,
  RendererResizeSample,
} from './black-hole/renderer.ts'

const WIDE_SCREEN_QUERY = '(min-width: 1024px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Inputs that decide whether the animated renderer may run. */
export interface BackgroundEligibility {
  themeActive: boolean
  phase: string | undefined
  wideScreen: boolean
  reducedMotion: boolean
  webGpu: boolean
}

/** The static fallback remains available while this decides animated eligibility. */
export function isBlackHoleBackgroundEligible(input: BackgroundEligibility): boolean {
  return input.themeActive
    && input.phase === 'hero'
    && input.wideScreen
    && !input.reducedMotion
    && input.webGpu
}

interface RendererFactory {
  (options: {
    canvas: HTMLCanvasElement
    onFrameSample?: (sample: RendererFrameSample) => void
    onResizeSample?: (sample: RendererResizeSample) => void
  }): BlackHoleRenderer
}

/** Owns the decorative layer attached to DSH's stable Conversation markers. */
export class BlackHoleBackgroundController {
  private readonly documentValue: Document
  private readonly windowValue: Window
  private readonly rendererFactory: RendererFactory
  private readonly wideScreen: MediaQueryList
  private readonly reducedMotion: MediaQueryList
  private observer: MutationObserver | undefined
  private themeActive = false
  private reconcileQueued = false
  private root: HTMLElement | undefined
  private layer: HTMLElement | undefined
  private canvas: HTMLCanvasElement | undefined
  private renderer: BlackHoleRenderer | undefined

  constructor(
    documentValue: Document = document,
    windowValue: Window = window,
    rendererFactory: RendererFactory,
  ) {
    this.documentValue = documentValue
    this.windowValue = windowValue
    this.rendererFactory = rendererFactory
    this.wideScreen = windowValue.matchMedia(WIDE_SCREEN_QUERY)
    this.reducedMotion = windowValue.matchMedia(REDUCED_MOTION_QUERY)
  }

  /** Start observing the persistent Conversation root. */
  start(): void {
    if (this.observer !== undefined) return
    this.observer = new MutationObserver(() => { this.scheduleReconcile() })
    this.observer.observe(this.documentValue.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-phase'],
    })
    this.wideScreen.addEventListener('change', this.onMediaChange)
    this.reducedMotion.addEventListener('change', this.onMediaChange)
    this.reconcile()
  }

  /** Adopt whether DSH resolved the custom theme. */
  setThemeActive(active: boolean): void {
    if (this.themeActive === active) return
    this.themeActive = active
    this.reconcile()
  }

  /** Release observers, DOM, and GPU resources. */
  dispose(): void {
    this.observer?.disconnect()
    this.observer = undefined
    this.wideScreen.removeEventListener('change', this.onMediaChange)
    this.reducedMotion.removeEventListener('change', this.onMediaChange)
    this.unmountLayer()
  }

  private readonly onMediaChange = (): void => { this.reconcile() }

  private scheduleReconcile(): void {
    if (this.reconcileQueued) return
    this.reconcileQueued = true
    queueMicrotask(() => {
      this.reconcileQueued = false
      this.reconcile()
    })
  }

  private conversationRoot(): HTMLElement | undefined {
    const selector = '[data-slot="conversation"][data-phase], [data-slot="conversation"] [data-phase]'
    return this.documentValue.querySelector<HTMLElement>(selector) ?? undefined
  }

  private reconcile(): void {
    const nextRoot = this.conversationRoot()
    const phase = nextRoot?.dataset.phase
    const showLayer = this.themeActive && phase === 'hero' && nextRoot !== undefined
    if (!showLayer) {
      this.unmountLayer()
      return
    }
    if (nextRoot !== this.root) {
      this.unmountLayer()
      this.mountLayer(nextRoot)
    }
    const eligible = isBlackHoleBackgroundEligible({
      themeActive: this.themeActive,
      phase,
      wideScreen: this.wideScreen.matches,
      reducedMotion: this.reducedMotion.matches,
      webGpu: 'gpu' in this.windowValue.navigator,
    })
    if (eligible) this.startRenderer()
    else this.stopRenderer('static')
  }

  private mountLayer(root: HTMLElement): void {
    const layer = this.documentValue.createElement('div')
    layer.className = 'dsh-black-hole-background'
    layer.dataset.dshBlackHoleBackground = ''
    layer.dataset.mode = 'static'
    layer.setAttribute('aria-hidden', 'true')
    const canvas = this.documentValue.createElement('canvas')
    canvas.className = 'dsh-black-hole-canvas'
    const veil = this.documentValue.createElement('div')
    veil.className = 'dsh-black-hole-veil'
    layer.append(canvas, veil)
    root.prepend(layer)
    root.dataset.dshBlackHoleRoot = ''
    this.root = root
    this.layer = layer
    this.canvas = canvas
  }

  private startRenderer(): void {
    if (this.renderer !== undefined || this.canvas === undefined || this.layer === undefined) return
    this.layer.dataset.mode = 'loading'
    const activeCanvas = this.canvas
    let renderer: BlackHoleRenderer
    try {
      renderer = this.rendererFactory({
        canvas: activeCanvas,
        onFrameSample: ({ fps, targetFps }) => {
          if (this.canvas !== activeCanvas || this.layer === undefined) return
          this.layer.dataset.fps = fps.toFixed(1)
          this.layer.dataset.targetFps = String(targetFps)
        },
        onResizeSample: ({ count, width, height }) => {
          if (this.canvas !== activeCanvas || this.layer === undefined) return
          this.layer.dataset.targetResizes = String(count)
          this.layer.dataset.targetSize = `${width}x${height}`
        },
      })
    } catch {
      this.layer.dataset.mode = 'fallback'
      return
    }
    this.renderer = renderer
    void renderer.ready.then(() => {
      if (this.renderer === renderer && this.layer !== undefined) this.layer.dataset.mode = 'ready'
    }).catch(() => {
      if (this.renderer !== renderer) return
      renderer.dispose()
      this.renderer = undefined
      if (this.layer !== undefined) this.layer.dataset.mode = 'fallback'
    })
  }

  private stopRenderer(mode: 'static' | 'fallback'): void {
    this.renderer?.dispose()
    this.renderer = undefined
    if (this.layer !== undefined) this.layer.dataset.mode = mode
  }

  private unmountLayer(): void {
    this.stopRenderer('static')
    this.layer?.remove()
    this.root?.removeAttribute('data-dsh-black-hole-root')
    this.root = undefined
    this.layer = undefined
    this.canvas = undefined
  }
}
