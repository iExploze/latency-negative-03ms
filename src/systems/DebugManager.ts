export type DebugSnapshot = {
  phase: string
  activeEvent: string
  elapsedMs: number
  delayMs: number
  displayedLatencyMs: number
  bufferFrameCount: number
  renderSource: 'live' | 'delayed' | 'mismatch' | 'prediction' | 'transfer'
  motionScore: number
  isStill: boolean
  stillnessMs: number
  mismatchActive: boolean
  negativeLatencyActive: boolean
  predictionEventActive: boolean
  predictionFootageSource: 'oppositeHandFromRightHandClip' | 'rightHandClip' | 'genericBufferFallback'
  liveFlickerActive: boolean
  dialogueActive: boolean
  dialogueLineId: string
  dialogueLineIndex: number
  dialogueText: string
  selectedChoiceId: string | null
  exitSequenceActive: boolean
  returnSequenceActive: boolean
  finalEndActive: boolean
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
      <div><span>activeEvent:</span> ${snapshot.activeEvent}</div>
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
      <div><span>dialogueActive:</span> ${snapshot.dialogueActive}</div>
      <div><span>dialogueLine:</span> ${snapshot.dialogueLineIndex} ${snapshot.dialogueLineId}</div>
      <div><span>dialogueText:</span> ${snapshot.dialogueText}</div>
      <div><span>choice:</span> ${snapshot.selectedChoiceId ?? 'none'}</div>
      <div><span>exitSequence:</span> ${snapshot.exitSequenceActive}</div>
      <div><span>returnSequence:</span> ${snapshot.returnSequenceActive}</div>
      <div><span>finalEnd:</span> ${snapshot.finalEndActive}</div>
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
