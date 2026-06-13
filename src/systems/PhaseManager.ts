export type PhaseId =
  | 'idle'
  | 'calibration'
  | 'delay'
  | 'mismatch'
  | 'negativeLatency'
  | 'reflectionDialogue'
  | 'reflectionExit'
  | 'return'
  | 'finalComplete'
  | 'finalEnd'
  | 'terminated'

export type DiagnosticReadouts = {
  latency: string
  reflection: string
  subject: string
  sync: string
  [key: string]: string
}

export type PhaseSnapshot = {
  id: PhaseId
  label: string
  elapsedMs: number
  delayMs: number
  displayedLatencyMs: number
  prompt: string
  diagnostics: DiagnosticReadouts
}

type PromptCue = {
  atMs: number
  text: string
}

const calibrationPrompts: PromptCue[] = [
  { atMs: 0, text: 'Please center yourself in the frame.' },
  { atMs: 10_000, text: 'Please look directly at yourself.' },
  { atMs: 20_000, text: 'Blink naturally.' },
  { atMs: 30_000, text: 'Raise your right hand.' },
  { atMs: 38_000, text: 'Lower your hand.' },
  { atMs: 43_000, text: 'Smile briefly.' },
  { atMs: 50_000, text: 'Remain still.' },
  { atMs: 60_000, text: 'Calibration complete.' },
]

export class PhaseManager {
  private readonly calibrationDurationMs: number
  private readonly delayRampDurationMs: number
  private readonly delayDurationMs: number
  private readonly mismatchDurationMs: number
  private readonly negativeLatencyDurationMs: number
  private readonly reflectionExitDurationMs: number
  private readonly returnDurationMs: number
  private readonly promptTimeScale: number
  private readonly calibrationPromptTimeScale: number
  private phaseId: PhaseId = 'idle'
  private phaseStartedAt = 0

  public constructor(debugMode = false) {
    this.calibrationDurationMs = debugMode ? 10_000 : 60_000
    this.delayRampDurationMs = debugMode ? 20_000 : 75_000
    this.delayDurationMs = debugMode ? 24_000 : 75_000
    this.mismatchDurationMs = debugMode ? 24_000 : 90_000
    this.negativeLatencyDurationMs = debugMode ? 22_000 : 75_000
    this.reflectionExitDurationMs = debugMode ? 24_000 : 60_000
    this.returnDurationMs = debugMode ? 18_000 : 45_000
    this.promptTimeScale = debugMode ? 0.4 : 1
    this.calibrationPromptTimeScale = debugMode ? this.calibrationDurationMs / 60_000 : 1
  }

  public start(nowMs: number): void {
    this.phaseId = 'calibration'
    this.phaseStartedAt = nowMs
  }

  public terminate(nowMs: number): void {
    this.phaseId = 'terminated'
    this.phaseStartedAt = nowMs
  }

  public startReflectionExit(nowMs: number): void {
    if (this.phaseId !== 'reflectionDialogue') {
      return
    }

    this.phaseId = 'reflectionExit'
    this.phaseStartedAt = nowMs
  }

  public closeMirror(nowMs: number): void {
    this.phaseId = 'finalEnd'
    this.phaseStartedAt = nowMs
  }

  public getSnapshot(nowMs: number): PhaseSnapshot {
    this.advance(nowMs)
    const elapsedMs = Math.max(0, nowMs - this.phaseStartedAt)

    if (this.phaseId === 'calibration') {
      return {
        id: this.phaseId,
        label: this.getCalibrationLabel(elapsedMs),
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 34,
        prompt: this.getPrompt(elapsedMs),
        diagnostics: {
          latency: '034ms',
          reflection: 'stable',
          subject: 'present',
          sync: 'normal',
        },
      }
    }

    if (this.phaseId === 'delay') {
      const delayMs = this.getDelayMs(elapsedMs)

      return {
        id: this.phaseId,
        label: 'SYNC CHECK: ACTIVE',
        elapsedMs,
        delayMs,
        displayedLatencyMs: delayMs,
        prompt: this.getDelayPrompt(elapsedMs),
        diagnostics: {
          latency: `${Math.round(delayMs).toString().padStart(3, '0')}ms`,
          reflection: 'stable',
          subject: 'present',
          sync: delayMs > 900 ? 'acceptable' : 'normal',
        },
      }
    }

    if (this.phaseId === 'mismatch') {
      return {
        id: this.phaseId,
        label: 'REFLECTION CHECK: UNSTABLE',
        elapsedMs,
        delayMs: 1500,
        displayedLatencyMs: 0,
        prompt: this.getMismatchPrompt(elapsedMs),
        diagnostics: {
          latency: 'unstable',
          reflection: 'recalibrating',
          subject: 'present',
          sync: 'drifting',
        },
      }
    }

    if (this.phaseId === 'negativeLatency') {
      const displayedLatencyMs = this.getNegativeLatencyMs(elapsedMs)

      return {
        id: this.phaseId,
        label: 'PREDICTION CHECK: ACTIVE',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs,
        prompt: this.getNegativeLatencyPrompt(elapsedMs),
        diagnostics: {
          latency: `-${Math.abs(displayedLatencyMs).toString().padStart(3, '0')}ms`,
          reflection: 'leading',
          subject: 'delayed',
          sync: 'invalid',
        },
      }
    }

    if (this.phaseId === 'reflectionDialogue') {
      return {
        id: this.phaseId,
        label: 'SUBJECT ORDER: UNRESOLVED',
        elapsedMs,
        delayMs: 1600,
        displayedLatencyMs: 0,
        prompt: '',
        diagnostics: {
          latency: 'invalid',
          reflection: 'leading',
          subject: 'duplicate',
          sync: 'unresolved',
          'exit permission': 'denied',
        },
      }
    }

    if (this.phaseId === 'reflectionExit') {
      return {
        id: this.phaseId,
        label: 'TRANSFER: ACTIVE',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 0,
        prompt: this.getReflectionExitPrompt(elapsedMs),
        diagnostics: {
          latency: 'null',
          reflection: 'released',
          subject: 'absent',
          sync: 'terminated',
        },
      }
    }

    if (this.phaseId === 'return') {
      return {
        id: this.phaseId,
        label: 'MIRROR RESTORED',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 34,
        prompt: this.getReturnPrompt(elapsedMs),
        diagnostics: {
          latency: '034ms',
          reflection: 'stable',
          subject: 'returned',
          sync: 'normal',
        },
      }
    }

    if (this.phaseId === 'finalComplete') {
      return {
        id: this.phaseId,
        label: 'TEST COMPLETE',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 0,
        prompt: '',
        diagnostics: {
          latency: '--',
          reflection: 'released',
          subject: 'returned',
          sync: 'closed',
        },
      }
    }

    if (this.phaseId === 'finalEnd') {
      return {
        id: this.phaseId,
        label: 'END',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 0,
        prompt: '',
        diagnostics: {
          latency: '--',
          reflection: 'released',
          subject: 'returned',
          sync: 'closed',
        },
      }
    }

    if (this.phaseId === 'terminated') {
      return {
        id: this.phaseId,
        label: 'TEST TERMINATED',
        elapsedMs,
        delayMs: 0,
        displayedLatencyMs: 0,
        prompt: 'Test terminated.',
        diagnostics: {
          latency: '--',
          reflection: 'closed',
          subject: 'released',
          sync: 'ended',
        },
      }
    }

    return {
      id: 'idle',
      label: 'STANDBY',
      elapsedMs: 0,
      delayMs: 0,
      displayedLatencyMs: 0,
      prompt: 'Awaiting mirror access.',
      diagnostics: {
        latency: '--',
        reflection: 'offline',
        subject: 'unknown',
        sync: 'pending',
      },
    }
  }

  private getCalibrationLabel(elapsedMs: number): string {
    const progress = Math.min(100, Math.floor((elapsedMs / this.calibrationDurationMs) * 100))
    return `CALIBRATION: ${progress}%`
  }

  private getPrompt(elapsedMs: number): string {
    return calibrationPrompts.reduce((activePrompt, cue) => {
      return elapsedMs >= cue.atMs * this.calibrationPromptTimeScale ? cue.text : activePrompt
    }, calibrationPrompts[0].text)
  }

  private advance(nowMs: number): void {
    if (this.phaseId === 'calibration' && nowMs - this.phaseStartedAt >= this.calibrationDurationMs) {
      this.phaseId = 'delay'
      this.phaseStartedAt = nowMs
      return
    }

    if (this.phaseId === 'delay' && nowMs - this.phaseStartedAt >= this.delayDurationMs) {
      this.phaseId = 'mismatch'
      this.phaseStartedAt = nowMs
      return
    }

    if (this.phaseId === 'mismatch' && nowMs - this.phaseStartedAt >= this.mismatchDurationMs) {
      this.phaseId = 'negativeLatency'
      this.phaseStartedAt = nowMs
      return
    }

    if (this.phaseId === 'negativeLatency' && nowMs - this.phaseStartedAt >= this.negativeLatencyDurationMs) {
      this.phaseId = 'reflectionDialogue'
      this.phaseStartedAt = nowMs
      return
    }

    if (this.phaseId === 'reflectionExit' && nowMs - this.phaseStartedAt >= this.reflectionExitDurationMs) {
      this.phaseId = 'return'
      this.phaseStartedAt = nowMs
      return
    }

    if (this.phaseId === 'return' && nowMs - this.phaseStartedAt >= this.returnDurationMs) {
      this.phaseId = 'finalComplete'
      this.phaseStartedAt = nowMs
    }
  }

  private getDelayMs(elapsedMs: number): number {
    const progress = Math.min(1, elapsedMs / this.delayRampDurationMs)
    return 300 + progress * 900
  }

  private getDelayPrompt(elapsedMs: number): string {
    if (elapsedMs >= 65_000) {
      return 'Minor latency detected.'
    }

    if (elapsedMs >= 50_000) {
      return 'Please remain still.'
    }

    if (elapsedMs >= 35_000) {
      return 'Lower your hand.'
    }

    if (elapsedMs >= 15_000) {
      return 'Raise your right hand.'
    }

    return 'Reflection stabilized.'
  }

  private getMismatchPrompt(elapsedMs: number): string {
    if (elapsedMs >= this.scaledPromptTime(80_000)) {
      return 'Recalibrating subject order.'
    }

    if (elapsedMs >= this.scaledPromptTime(65_000)) {
      return 'Do not correct it.'
    }

    if (elapsedMs >= this.scaledPromptTime(45_000)) {
      return 'Reflection drift detected.'
    }

    if (elapsedMs >= this.scaledPromptTime(30_000)) {
      return 'Good.'
    }

    if (elapsedMs >= this.scaledPromptTime(15_000)) {
      return 'Hold still.'
    }

    return 'Please do not move.'
  }

  private getNegativeLatencyPrompt(elapsedMs: number): string {
    if (elapsedMs >= this.scaledPromptTime(42_000)) {
      return 'Original unresolved.'
    }

    if (elapsedMs >= this.scaledPromptTime(30_000)) {
      return 'Prediction error detected.'
    }

    if (elapsedMs >= this.scaledPromptTime(18_000)) {
      return 'Subject moved late.'
    }

    if (elapsedMs >= this.scaledPromptTime(12_000)) {
      return 'Raise your left hand.'
    }

    return 'Please follow the reflection.'
  }

  private getNegativeLatencyMs(elapsedMs: number): number {
    const progress = Math.min(1, elapsedMs / this.scaledPromptTime(42_000))
    return -Math.round(3 + progress * 100)
  }

  private scaledPromptTime(timeMs: number): number {
    return timeMs * this.promptTimeScale
  }

  private getReflectionExitPrompt(elapsedMs: number): string {
    if (elapsedMs >= this.scaledPromptTime(43_000)) {
      return 'REFLECTION RELEASED'
    }

    if (elapsedMs >= this.scaledPromptTime(32_000)) {
      return 'SUBJECT COUNT: 0'
    }

    if (elapsedMs >= this.scaledPromptTime(22_000)) {
      return 'SUBJECT COUNT: 1'
    }

    if (elapsedMs >= this.scaledPromptTime(10_000)) {
      return 'Do not interrupt the transfer.'
    }

    return 'Stay there.'
  }

  private getReturnPrompt(elapsedMs: number): string {
    if (elapsedMs >= this.scaledPromptTime(24_000)) {
      return "I couldn't leave until you arrived."
    }

    if (elapsedMs >= this.scaledPromptTime(16_000)) {
      return 'Thank you.'
    }

    if (elapsedMs >= this.scaledPromptTime(8_000)) {
      return 'You’re back.'
    }

    return 'Good.'
  }
}
