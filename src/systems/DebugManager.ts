export type DebugSnapshot = {
  phase: string
  elapsedMs: number
  delayMs: number
  displayedLatencyMs: number
  bufferFrameCount: number
  renderSource: 'live' | 'delayed' | 'mismatch' | 'prediction'
  motionScore: number
  isStill: boolean
  stillnessMs: number
  mismatchActive: boolean
  negativeLatencyActive: boolean
  predictionEventActive: boolean
  predictionFootageSource: 'handClip' | 'movementBuffer'
  liveFlickerActive: boolean
  stillnessTriggerMs: number
  mismatchDurationMs: number
  jitterIntensityPx: number
}

export class DebugManager {
  public readonly enabled: boolean
  private readonly element: HTMLElement

  public constructor(element: HTMLElement, searchParams: URLSearchParams) {
    this.element = element
    this.enabled = searchParams.get('debug') === '1'
    this.element.classList.add('hidden')
  }

  public update(snapshot: DebugSnapshot): void {
    if (!this.enabled) {
      return
    }

    this.element.classList.remove('hidden')
    this.element.innerHTML = `
      <div><span>phase:</span> ${snapshot.phase}</div>
      <div><span>elapsed:</span> ${(snapshot.elapsedMs / 1000).toFixed(1)}s</div>
      <div><span>delayMs:</span> ${Math.round(snapshot.delayMs)}</div>
      <div><span>displayedLatency:</span> ${Math.round(snapshot.displayedLatencyMs)}ms</div>
      <div><span>bufferFrames:</span> ${snapshot.bufferFrameCount}</div>
      <div><span>renderSource:</span> ${snapshot.renderSource}</div>
      <div><span>motionScore:</span> ${snapshot.motionScore.toFixed(2)}</div>
      <div><span>isStill:</span> ${snapshot.isStill}</div>
      <div><span>stillnessMs:</span> ${Math.round(snapshot.stillnessMs)}</div>
      <div><span>mismatchActive:</span> ${snapshot.mismatchActive}</div>
      <div><span>negativeLatency:</span> ${snapshot.negativeLatencyActive}</div>
      <div><span>predictionActive:</span> ${snapshot.predictionEventActive}</div>
      <div><span>predictionSource:</span> ${snapshot.predictionFootageSource}</div>
      <div><span>liveFlicker:</span> ${snapshot.liveFlickerActive}</div>
      <div><span>stillTrigger:</span> ${snapshot.stillnessTriggerMs}ms</div>
      <div><span>mismatchDur:</span> ${snapshot.mismatchDurationMs}ms</div>
      <div><span>jitterPx:</span> ${snapshot.jitterIntensityPx.toFixed(2)}</div>
    `
  }

  public clear(): void {
    if (this.enabled) {
      this.element.innerHTML = ''
      this.element.classList.add('hidden')
    }
  }
}
