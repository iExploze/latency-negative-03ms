export type BufferedFrame = {
  timeMs: number
  imageData: ImageData
}

export class FrameBuffer {
  private readonly width: number
  private readonly height: number
  private readonly maxDurationMs: number
  private readonly captureCanvas: HTMLCanvasElement
  private readonly captureContext: CanvasRenderingContext2D
  private readonly frames: BufferedFrame[] = []
  private readonly captureIntervalMs: number
  private readonly maxFrameCount: number
  private lastCaptureAt = 0

  public constructor(
    width: number,
    height: number,
    maxDurationMs: number,
    captureFps: number,
  ) {
    this.width = width
    this.height = height
    this.maxDurationMs = maxDurationMs
    this.captureCanvas = document.createElement('canvas')
    this.captureCanvas.width = width
    this.captureCanvas.height = height

    const context = this.captureCanvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      throw new Error('Frame buffer canvas could not be initialized.')
    }

    this.captureContext = context
    this.captureIntervalMs = 1000 / captureFps
    this.maxFrameCount = Math.ceil((maxDurationMs / 1000) * captureFps)
  }

  public maybeCapture(source: CanvasImageSource, timestampMs: number): void {
    if (timestampMs - this.lastCaptureAt < this.captureIntervalMs) {
      return
    }

    this.pushFrame(source, timestampMs)
    this.lastCaptureAt = timestampMs
  }

  public pushFrame(source: CanvasImageSource, timestampMs: number): void {
    this.captureContext.drawImage(source, 0, 0, this.width, this.height)
    const imageData = this.captureContext.getImageData(0, 0, this.width, this.height)
    this.frames.push({ timeMs: timestampMs, imageData })
    this.trimOldFrames(timestampMs)
  }

  public getFrameAtDelay(nowMs: number, delayMs: number): ImageData | null {
    return this.getNearestFrame(nowMs - delayMs)
  }

  public getNearestFrame(targetTimeMs: number): ImageData | null {
    if (this.frames.length === 0) {
      return null
    }

    let nearest = this.frames[0]
    let nearestDistance = Math.abs(nearest.timeMs - targetTimeMs)

    for (const frame of this.frames) {
      const distance = Math.abs(frame.timeMs - targetTimeMs)

      if (distance <= nearestDistance) {
        nearest = frame
        nearestDistance = distance
      }

      if (frame.timeMs > targetTimeMs && distance > nearestDistance) {
        break
      }
    }

    return nearest.imageData
  }

  public clear(): void {
    this.frames.length = 0
    this.lastCaptureAt = 0
  }

  public getFrameCount(): number {
    return this.frames.length
  }

  private trimOldFrames(nowMs: number): void {
    const oldestAllowedAt = nowMs - this.maxDurationMs

    while (this.frames.length > 0 && this.frames[0].timeMs < oldestAllowedAt) {
      this.frames.shift()
    }

    while (this.frames.length > this.maxFrameCount) {
      this.frames.shift()
    }
  }
}
