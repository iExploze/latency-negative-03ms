export type MotionState = {
  score: number
  isStill: boolean
  stillnessMs: number
}

const DEFAULT_STATE: MotionState = {
  score: 0,
  isStill: false,
  stillnessMs: 0,
}

export class MotionDetector {
  private readonly sampleCanvas: HTMLCanvasElement
  private readonly sampleContext: CanvasRenderingContext2D
  private readonly stillThreshold: number
  private readonly sampleIntervalMs: number
  private previousFrame: ImageData | null = null
  private lastSampleAt = 0
  private smoothedScore = 0
  private state = DEFAULT_STATE

  public constructor(width = 64, height = 48, stillThreshold = 5, sampleFps = 10) {
    this.stillThreshold = stillThreshold
    this.sampleIntervalMs = 1000 / sampleFps
    this.sampleCanvas = document.createElement('canvas')
    this.sampleCanvas.width = width
    this.sampleCanvas.height = height

    const context = this.sampleCanvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      throw new Error('Motion detector canvas could not be initialized.')
    }

    this.sampleContext = context
  }

  public updateFromVideo(video: HTMLVideoElement, timestampMs: number): MotionState {
    if (timestampMs - this.lastSampleAt < this.sampleIntervalMs) {
      return this.state
    }

    this.sampleContext.drawImage(video, 0, 0, this.sampleCanvas.width, this.sampleCanvas.height)
    const currentFrame = this.sampleContext.getImageData(0, 0, this.sampleCanvas.width, this.sampleCanvas.height)
    const rawScore = this.previousFrame ? this.getMotionScore(currentFrame, this.previousFrame) : 0
    this.smoothedScore = this.previousFrame ? this.smoothedScore * 0.72 + rawScore * 0.28 : rawScore

    const deltaMs = this.lastSampleAt === 0 ? 0 : timestampMs - this.lastSampleAt
    const isStill = this.smoothedScore < this.stillThreshold
    const stillnessMs = isStill ? this.state.stillnessMs + deltaMs : 0

    this.state = {
      score: this.smoothedScore,
      isStill,
      stillnessMs,
    }
    this.previousFrame = currentFrame
    this.lastSampleAt = timestampMs

    return this.state
  }

  public reset(): void {
    this.previousFrame = null
    this.lastSampleAt = 0
    this.smoothedScore = 0
    this.state = DEFAULT_STATE
  }

  public getState(): MotionState {
    return this.state
  }

  private getMotionScore(currentFrame: ImageData, previousFrame: ImageData): number {
    let total = 0
    let count = 0

    for (let i = 0; i < currentFrame.data.length; i += 16) {
      const currentLuma = this.getLuma(currentFrame.data[i], currentFrame.data[i + 1], currentFrame.data[i + 2])
      const previousLuma = this.getLuma(previousFrame.data[i], previousFrame.data[i + 1], previousFrame.data[i + 2])
      total += Math.abs(currentLuma - previousLuma)
      count += 1
    }

    return count > 0 ? total / count : 0
  }

  private getLuma(red: number, green: number, blue: number): number {
    return 0.299 * red + 0.587 * green + 0.114 * blue
  }
}
