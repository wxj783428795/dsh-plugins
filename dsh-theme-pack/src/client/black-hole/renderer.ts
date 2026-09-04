// Browser lifecycle for the baked black-hole pipeline.

import type { Frame, Gpu, Surface } from "vgpu";

type VgpuApi = typeof import("vgpu");

import {
  createEffects,
  createTargets,
  destroyTargets,
  prewarm,
  renderChain,
  setBakeUniforms,
  setBindings,
  setPostUniforms,
  setShadeUniforms,
  type Effects,
  type Targets,
} from "./pipeline";
import { FramePacer, TARGET_FPS } from "./frame-pacer";
import { defaultHeroSettings } from "./settings";

const SCENE_YAW_TAU_S = 0.325;

const MAX_FRAME_DT_S = 0.1;

const BACKGROUND_DPR = 0.7;
const MOBILE_QUERY = "(max-width: 767px)";
const RESIZE_SETTLE_MS = 120;

export interface RendererFrameSample {
  fps: number;
  targetFps: number;
}

export interface RendererResizeSample {
  count: number;
  width: number;
  height: number;
}

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  onFrameSample?: (sample: RendererFrameSample) => void;
  onResizeSample?: (sample: RendererResizeSample) => void;
}

/** Lifecycle returned to the theme controller. */
export interface BlackHoleRenderer {
  ready: Promise<void>;
  dispose(): void;
}

type RenderSize = { width: number; height: number };

export function createRenderer({
  canvas,
  onFrameSample,
  onResizeSample,
}: RendererOptions): BlackHoleRenderer {
  const settings = defaultHeroSettings();
  const desktopLayout = {
    centerX: settings.centerX,
    centerY: settings.centerY,
    cameraRoll: settings.cameraRoll,
    mouseYaw: settings.mouseYaw,
    centerFade: settings.centerFade,
  };
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const applyResponsiveLayout = () => {
    Object.assign(
      settings,
      mobileQuery.matches
        ? {
            centerX: 0,
            centerY: 0,
            cameraRoll: 0,
            mouseYaw: 0,
            centerFade: 1,
          }
        : desktopLayout
    );
  };
  applyResponsiveLayout();
  const bloomScale = Math.min(Math.max(window.devicePixelRatio, 1), 2) / 2;
  settings.bloom.radius *= bloomScale;
  settings.bloom.strength *= bloomScale;

  let disposed = false;

  let api: VgpuApi | undefined;
  let gpu: Gpu | undefined;
  let surface: Surface | undefined;
  let effects: Effects | undefined;
  let targets: Targets | undefined;
  let loop: { stop(): void } | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let intersection: IntersectionObserver | undefined;
  let documentVisible =
    typeof document === "undefined" ? true : !document.hidden;
  let canvasIntersecting = true;

  let started = false;
  let animationTime = 0;
  let lastFrameAt: number | undefined;
  let resizeTimer: number | undefined;
  let pendingSize: RenderSize | undefined;
  let forceBake = true;
  let pointerXNormalized = 0;
  let currentSceneYaw = 0;
  let lastYawAt: number | undefined;
  let sampleStartedAt: number | undefined;
  let sampleFrames = 0;
  let resizeCount = 0;

  const onLayoutChange = () => {
    applyResponsiveLayout();
    forceBake = true;
  };
  mobileQuery.addEventListener("change", onLayoutChange);

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const width = Math.max(window.innerWidth, 1);
    pointerXNormalized = Math.min(
      1,
      Math.max(-1, (event.clientX / width) * 2 - 1)
    );
  };

  const recenterPointer = () => {
    pointerXNormalized = 0;
  };
  const onPointerOut = (event: PointerEvent) => {
    if (event.relatedTarget === null) recenterPointer();
  };
  const onVisibilityChange = () => {
    if (document.hidden) recenterPointer();
    documentVisible = !document.hidden;
    reconcileLoop();
  };

  function reconcileLoop(): void {
    if (!started || !gpu || !api) return;
    const shouldRun = !disposed && documentVisible && canvasIntersecting;
    if (shouldRun === Boolean(loop)) return;
    if (shouldRun) {
      lastFrameAt = undefined;
      lastYawAt = undefined;
      loop = startPacedLoop(api, gpu);
    } else {
      loop?.stop();
      loop = undefined;
    }
  }

  function startPacedLoop(vgpu: VgpuApi, activeGpu: Gpu): { stop(): void } {
    let stopped = false;
    const pacer = new FramePacer();

    const tick = (timestamp: number): void => {
      if (stopped) return;
      if (pacer.shouldPresent(timestamp)) {
        try {
          vgpu.frame(activeGpu, renderFrame);
        } catch (error) {
          handleFailure(error);
        }
      }
      if (!stopped) frameHandle = requestAnimationFrame(tick);
    };
    let frameHandle = requestAnimationFrame(tick);
    return {
      stop(): void {
        stopped = true;
        cancelAnimationFrame(frameHandle);
      },
    };
  }

  const advanceAnimationTime = (now: number): number => {
    animationTime +=
      lastFrameAt === undefined ? 0 : Math.max(0, (now - lastFrameAt) / 1000);
    lastFrameAt = now;
    return animationTime;
  };

  const renderFrame = (frame: Frame): void => {
    if (disposed || !effects || !targets || !surface) return;
    const now = clockMs();
    const runBake = forceBake;
    forceBake = false;
    if (runBake) setBakeUniforms(effects, targets, settings);
    setShadeUniforms(
      effects,
      targets,
      settings,
      advanceAnimationTime(now),
      advanceSceneYaw(now)
    );
    renderChain(frame, effects, targets, surface, runBake);
    recordFrameSample(now);
  };

  const recordFrameSample = (now: number): void => {
    if (sampleStartedAt === undefined) {
      sampleStartedAt = now;
      sampleFrames = 1;
      return;
    }
    sampleFrames += 1;
    const elapsedMs = now - sampleStartedAt;
    if (elapsedMs < 1000) return;
    onFrameSample?.({
      fps: Math.max(0, (sampleFrames - 1) * 1000 / elapsedMs),
      targetFps: TARGET_FPS,
    });
    sampleStartedAt = now;
    sampleFrames = 1;
  };

  const advanceSceneYaw = (now: number): number => {
    if (settings.mouseYaw <= 0) {
      currentSceneYaw = 0;
      lastYawAt = now;
      return 0;
    }
    const dt =
      lastYawAt === undefined
        ? 0
        : Math.min(Math.max((now - lastYawAt) / 1000, 0), MAX_FRAME_DT_S);
    lastYawAt = now;
    const target = pointerXNormalized * Math.max(0, settings.mouseYaw);
    currentSceneYaw +=
      (target - currentSceneYaw) * (1 - Math.exp(-dt / SCENE_YAW_TAU_S));
    return currentSceneYaw;
  };

  const applyResize = () => {
    resizeTimer = undefined;
    const size = pendingSize;
    pendingSize = undefined;
    if (disposed || !size || !gpu || !api || !effects || !targets || !surface)
      return;
    const width = Math.max(1, Math.round(size.width));
    const height = Math.max(1, Math.round(size.height));
    if (targets.gbuffer.size[0] === width && targets.gbuffer.size[1] === height)
      return;
    try {
      const previousTargets = targets;
      const nextTargets = createTargets(api, gpu, [width, height]);
      try {
        setBindings(effects, nextTargets);
        setPostUniforms(effects, nextTargets, settings);
      } catch (error) {
        destroyTargets(nextTargets);
        throw error;
      }
      targets = nextTargets;
      destroyTargets(previousTargets);
      forceBake = true;
      resizeCount += 1;
      onResizeSample?.({
        count: resizeCount,
        width,
        height,
      });
    } catch (error) {
      handleFailure(error);
    }
  };
  const resize = (size: RenderSize) => {
    if (disposed || size.width <= 0 || size.height <= 0) return;
    pendingSize = size;
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyResize, RESIZE_SETTLE_MS);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loop?.stop();
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    unsubscribeResize?.();
    intersection?.disconnect();
    if (typeof window !== "undefined") {
      mobileQuery.removeEventListener("change", onLayoutChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", recenterPointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
    gpu?.dispose();
  };

  const initialize = async () => {
    const vgpu = await import("vgpu");
    const { init } = vgpu;
    if (disposed) return;
    const nextGpu = await init();
    if (disposed) {
      nextGpu.dispose();
      return;
    }
    gpu = nextGpu;
    api = vgpu;
    surface = vgpu.surface(gpu, canvas, { dpr: BACKGROUND_DPR });
    effects = createEffects(vgpu, gpu);
    targets = createTargets(vgpu, gpu, surface.size);
    setBindings(effects, targets);
    setPostUniforms(effects, targets, settings);
    onResizeSample?.({
      count: resizeCount,
      width: targets.gbuffer.size[0],
      height: targets.gbuffer.size[1],
    });
    await prewarm(effects, targets, surface);
    if (disposed) return;
    unsubscribeResize = surface.onResize(({ width, height }) => {
      resize({ width, height });
    });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", recenterPointer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver(
        (entries) => {
          canvasIntersecting =
            entries[entries.length - 1]?.isIntersecting ?? canvasIntersecting;
          reconcileLoop();
        },
        { threshold: 0 }
      );
      intersection.observe(canvas);
    }
    started = true;
    documentVisible = !document.hidden;
    reconcileLoop();
  };

  function handleFailure(error: unknown): never {
    dispose();
    throw error;
  }

  const ready = initialize().catch((error: unknown) => {
    if (disposed) return;
    handleFailure(error);
  });

  return { ready, dispose };
}

function clockMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
