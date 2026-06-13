import type { PhaseSnapshot } from './PhaseManager'

type RenderOptions = {
  video: HTMLVideoElement
  phase: PhaseSnapshot
  isCameraReady: boolean
}

export class EffectsRenderer {
  private readonly context: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private animationSeed = Math.random() * 1000

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Mirror canvas could not be initialized.')
    }

    this.context = context
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

    if (options.isCameraReady) {
      this.drawMirroredVideo(options.video, width, height)
    } else {
      this.drawStandby(width, height)
    }

    this.drawClinicalOverlays(width, height, options.phase)
  }

  private drawMirroredVideo(video: HTMLVideoElement, width: number, height: number): void {
    const videoRatio = video.videoWidth / video.videoHeight || 4 / 3
    const canvasRatio = width / height
    const drawHeight = canvasRatio > videoRatio ? height : width / videoRatio
    const drawWidth = drawHeight * videoRatio
    const x = (width - drawWidth) / 2
    const y = (height - drawHeight) / 2

    this.context.save()
    this.context.translate(width, 0)
    this.context.scale(-1, 1)
    this.context.drawImage(video, x, y, drawWidth, drawHeight)
    this.context.restore()
  }

  private drawStandby(width: number, height: number): void {
    this.context.fillStyle = '#050608'
    this.context.fillRect(0, 0, width, height)
    this.context.fillStyle = 'rgba(232, 232, 232, 0.58)'
    this.context.font = `${Math.max(14, Math.floor(width * 0.018))}px ui-monospace, monospace`
    this.context.textAlign = 'center'
    this.context.fillText('MIRROR OFFLINE', width / 2, height / 2)
  }

  private drawClinicalOverlays(width: number, height: number, phase: PhaseSnapshot): void {
    this.drawVignette(width, height)
    this.drawScanlines(width, height)
    this.drawNoise(width, height)

    if (phase.id === 'terminated') {
      this.context.fillStyle = 'rgba(3, 3, 4, 0.74)'
      this.context.fillRect(0, 0, width, height)
    }
  }

  private drawVignette(width: number, height: number): void {
    const gradient = this.context.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.16,
      width / 2,
      height / 2,
      width * 0.72,
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.48)')
    this.context.fillStyle = gradient
    this.context.fillRect(0, 0, width, height)
  }

  private drawScanlines(width: number, height: number): void {
    this.context.fillStyle = 'rgba(255, 255, 255, 0.035)'

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
}
