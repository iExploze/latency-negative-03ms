import type { PhaseSnapshot } from './PhaseManager'

type RenderOptions = {
  source: CanvasImageSource | ImageData | null
  phase: PhaseSnapshot
  timestampMs: number
  mismatchActive: boolean
  predictionActive: boolean
  extraHorizontalFlip: boolean
}

export class EffectsRenderer {
  private readonly context: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly frameCanvas: HTMLCanvasElement
  private readonly frameContext: CanvasRenderingContext2D
  private animationSeed = Math.random() * 1000

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Mirror canvas could not be initialized.')
    }

    this.context = context
    this.frameCanvas = document.createElement('canvas')

    const frameContext = this.frameCanvas.getContext('2d')

    if (!frameContext) {
      throw new Error('Frame render canvas could not be initialized.')
    }

    this.frameContext = frameContext
  }

  public resize(): void {
    const bounds = this.canvas.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.floor(bounds.width * pixelRatio))
    const height = Math.max(1, Math.floor(bounds.height * pixelRatio))

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  public render(options: RenderOptions): void {
    this.resize()

    const { width, height } = this.canvas
    this.context.clearRect(0, 0, width, height)

    if (options.source) {
      this.drawMirroredSource(options.source, width, height, options)
    } else {
      this.drawStandby(width, height)
    }

    this.drawClinicalOverlays(width, height, options)
  }

  public getJitterIntensity(phaseId: string, eventActive: boolean): number {
    if (phaseId === 'mismatch') {
      return eventActive ? 1.35 : 0.45
    }

    if (phaseId === 'negativeLatency') {
      return eventActive ? 1.1 : 0.3
    }

    if (phaseId === 'reflectionDialogue') {
      return 0.25
    }

    if (phaseId === 'reflectionExit') {
      return eventActive ? 1.2 : 0.7
    }

    if (phaseId === 'delay') {
      return 0.25
    }

    return 0
  }

  private drawMirroredSource(
    source: CanvasImageSource | ImageData,
    width: number,
    height: number,
    options: RenderOptions,
  ): void {
    const drawableSource = source instanceof ImageData ? this.imageDataToCanvas(source) : source
    const sourceWidth = this.getSourceWidth(drawableSource)
    const sourceHeight = this.getSourceHeight(drawableSource)
    const videoRatio = sourceWidth / sourceHeight || 4 / 3
    const canvasRatio = width / height
    const transferProgress = this.getTransferProgress(options)
    const zoom = options.phase.id === 'reflectionExit' ? 1.04 + transferProgress * 0.035 : 1
    const drawHeight = (canvasRatio > videoRatio ? height : width / videoRatio) * zoom
    const drawWidth = drawHeight * videoRatio
    const jitter = this.getJitter(options)
    const x = (width - drawWidth) / 2 + jitter.x
    const y = (height - drawHeight) / 2 + jitter.y

    if (options.extraHorizontalFlip) {
      this.drawSourcePass(drawableSource, width, x, y, drawWidth, drawHeight, true, 0.52)
      this.drawSourcePass(
        drawableSource,
        width,
        x + Math.sin(options.timestampMs * 0.018) * 2.2,
        y,
        drawWidth,
        drawHeight,
        false,
        0.78,
      )
      return
    }

    this.drawSourcePass(drawableSource, width, x, y, drawWidth, drawHeight, true, 1)
  }

  private drawSourcePass(
    source: CanvasImageSource,
    canvasWidth: number,
    x: number,
    y: number,
    width: number,
    height: number,
    mirrored: boolean,
    alpha: number,
  ): void {
    this.context.save()
    this.context.globalAlpha = alpha
    if (mirrored) {
      this.context.translate(canvasWidth, 0)
      this.context.scale(-1, 1)
    }
    this.context.drawImage(source, x, y, width, height)
    this.context.restore()
  }

  private imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    if (this.frameCanvas.width !== imageData.width || this.frameCanvas.height !== imageData.height) {
      this.frameCanvas.width = imageData.width
      this.frameCanvas.height = imageData.height
    }

    this.frameContext.putImageData(imageData, 0, 0)
    return this.frameCanvas
  }

  private getSourceWidth(source: CanvasImageSource): number {
    if ('videoWidth' in source && source.videoWidth > 0) {
      return source.videoWidth
    }

    return 'width' in source ? Number(source.width) : 640
  }

  private getSourceHeight(source: CanvasImageSource): number {
    if ('videoHeight' in source && source.videoHeight > 0) {
      return source.videoHeight
    }

    return 'height' in source ? Number(source.height) : 480
  }

  private drawStandby(width: number, height: number): void {
    this.context.fillStyle = '#050608'
    this.context.fillRect(0, 0, width, height)
    this.context.fillStyle = 'rgba(232, 232, 232, 0.58)'
    this.context.font = `${Math.max(14, Math.floor(width * 0.018))}px ui-monospace, monospace`
    this.context.textAlign = 'center'
    this.context.fillText('MIRROR OFFLINE', width / 2, height / 2)
  }

  private drawClinicalOverlays(width: number, height: number, options: RenderOptions): void {
    this.drawVignette(width, height, options)
    this.drawScanlines(width, height, options)
    this.drawNoise(width, height)
    this.drawGlitchBlocks(width, height, options)
    this.drawExitShadow(width, height, options)

    if (options.phase.id === 'terminated') {
      this.context.fillStyle = 'rgba(3, 3, 4, 0.74)'
      this.context.fillRect(0, 0, width, height)
    }
  }

  private drawVignette(width: number, height: number, options: RenderOptions): void {
    const transferProgress = this.getTransferProgress(options)
    const finalOpacity = options.phase.id === 'reflectionExit'
      ? 0.72 + transferProgress * 0.2
      : options.phase.id === 'reflectionDialogue'
      ? 0.72
      : options.predictionActive
        ? 0.68
        : options.phase.id === 'negativeLatency'
          ? 0.64
          : options.phase.id === 'mismatch'
            ? 0.58
            : 0.48
    const gradient = this.context.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.16,
      width / 2,
      height / 2,
      width * 0.72,
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(0, 0, 0, ${finalOpacity})`)
    this.context.fillStyle = gradient
    this.context.fillRect(0, 0, width, height)
  }

  private drawScanlines(width: number, height: number, options: RenderOptions): void {
    const transferProgress = this.getTransferProgress(options)
    const opacity = options.phase.id === 'reflectionExit'
      ? 0.08 + transferProgress * 0.065
      : options.phase.id === 'reflectionDialogue'
      ? 0.074
      : options.predictionActive
        ? 0.078
        : options.phase.id === 'negativeLatency'
          ? 0.064
          : options.phase.id === 'mismatch'
            ? 0.052
            : 0.035
    this.context.fillStyle = `rgba(255, 255, 255, ${opacity})`

    for (let y = 0; y < height; y += 6) {
      this.context.fillRect(0, y, width, 1)
    }
  }

  private drawNoise(width: number, height: number): void {
    this.animationSeed += 0.7
    const blockSize = Math.max(1, Math.floor(width / 160))
    this.context.fillStyle = 'rgba(255, 255, 255, 0.025)'

    for (let i = 0; i < 90; i += 1) {
      const x = Math.abs(Math.sin(this.animationSeed + i * 12.9898)) * width
      const y = Math.abs(Math.cos(this.animationSeed + i * 78.233)) * height
      this.context.fillRect(x, y, blockSize, blockSize)
    }
  }

  private getJitter(options: RenderOptions): { x: number; y: number } {
    const intensity = this.getJitterIntensity(options.phase.id, options.mismatchActive || options.predictionActive)

    if (intensity === 0) {
      return { x: 0, y: 0 }
    }

    const steppedTime = Math.floor(options.timestampMs / 120) * 120

    return {
      x: Math.sin(steppedTime * 0.021) * intensity,
      y: Math.cos(steppedTime * 0.019) * intensity * 0.45,
    }
  }

  private drawGlitchBlocks(width: number, height: number, options: RenderOptions): void {
    if (
      !options.mismatchActive
      && !options.predictionActive
      && options.phase.id !== 'reflectionDialogue'
      && options.phase.id !== 'reflectionExit'
    ) {
      return
    }

    const transferProgress = this.getTransferProgress(options)
    const pulse = Math.abs(Math.sin(options.timestampMs * (options.predictionActive ? 0.024 : options.phase.id === 'reflectionExit' ? 0.018 + transferProgress * 0.026 : 0.018)))

    if (pulse < (options.phase.id === 'reflectionExit' ? 0.62 - transferProgress * 0.32 : options.phase.id === 'reflectionDialogue' ? 0.82 : options.predictionActive ? 0.68 : 0.58)) {
      return
    }

    this.context.fillStyle = options.predictionActive
      ? 'rgba(232, 232, 232, 0.11)'
      : options.phase.id === 'reflectionExit'
        ? `rgba(232, 232, 232, ${0.07 + transferProgress * 0.07})`
        : 'rgba(232, 232, 232, 0.08)'

    const blockCount = options.phase.id === 'reflectionExit' ? 5 + Math.floor(transferProgress * 7) : 7

    for (let i = 0; i < blockCount; i += 1) {
      const x = Math.abs(Math.sin(options.timestampMs * 0.01 + i * 19.19)) * width
      const y = Math.abs(Math.cos(options.timestampMs * 0.012 + i * 11.73)) * height
      const blockWidth = 12 + Math.abs(Math.sin(i + options.timestampMs)) * (58 + transferProgress * 72)
      const blockHeight = options.phase.id === 'reflectionExit' && i % 4 === 0 ? 4 : 2
      this.context.fillRect(x, y, blockWidth, blockHeight)
    }
  }

  private drawExitShadow(width: number, height: number, options: RenderOptions): void {
    if (options.phase.id !== 'reflectionExit') {
      return
    }

    const prompt = options.phase.prompt
    const absenceActive = prompt === 'SUBJECT COUNT: 0' || prompt === 'REFLECTION RELEASED'
    const transferProgress = this.getTransferProgress(options)
    const shadowOpacity = absenceActive ? 0.76 + transferProgress * 0.08 : 0.3 + transferProgress * 0.18
    const gradient = this.context.createRadialGradient(
      width / 2,
      height * 0.48,
      width * 0.05,
      width / 2,
      height * 0.48,
      width * 0.28,
    )

    gradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`)
    gradient.addColorStop(0.58, `rgba(0, 0, 0, ${shadowOpacity * 0.48})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    this.context.fillStyle = gradient
    this.context.fillRect(0, 0, width, height)

    if (absenceActive && Math.sin(options.timestampMs * 0.012) > 0.88) {
      this.context.fillStyle = 'rgba(0, 0, 0, 0.42)'
      this.context.fillRect(0, 0, width, height)
    }
  }

  private getTransferProgress(options: RenderOptions): number {
    if (options.phase.id !== 'reflectionExit') {
      return 0
    }

    return Math.min(1, options.phase.elapsedMs / 60_000)
  }
}
