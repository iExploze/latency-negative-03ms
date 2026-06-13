export type PhaseId = 'idle' | 'calibration' | 'terminated'

export type DiagnosticReadouts = {
  latency: string
  reflection: string
  subject: string
  sync: string
}

export type PhaseSnapshot = {
  id: PhaseId
  label: string
  elapsedMs: number
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
  { atMs: 40_000, text: 'Smile briefly.' },
  { atMs: 50_000, text: 'Remain still.' },
  { atMs: 60_000, text: 'Calibration complete.' },
]

export class PhaseManager {
  private phaseId: PhaseId = 'idle'
  private phaseStartedAt = 0

  public start(nowMs: number): void {
    this.phaseId = 'calibration'
    this.phaseStartedAt = nowMs
  }

  public terminate(nowMs: number): void {
    this.phaseId = 'terminated'
    this.phaseStartedAt = nowMs
  }

  public getSnapshot(nowMs: number): PhaseSnapshot {
    const elapsedMs = Math.max(0, nowMs - this.phaseStartedAt)

    if (this.phaseId === 'calibration') {
      return {
        id: this.phaseId,
        label: this.getCalibrationLabel(elapsedMs),
        elapsedMs,
        prompt: this.getPrompt(elapsedMs),
        diagnostics: {
          latency: '034ms',
          reflection: 'stable',
          subject: 'present',
          sync: 'normal',
        },
      }
    }

    if (this.phaseId === 'terminated') {
      return {
        id: this.phaseId,
        label: 'TEST TERMINATED',
        elapsedMs,
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
    const progress = Math.min(100, Math.floor((elapsedMs / 60_000) * 100))
    return `CALIBRATION: ${progress}%`
  }

  private getPrompt(elapsedMs: number): string {
    return calibrationPrompts.reduce((activePrompt, cue) => {
      return elapsedMs >= cue.atMs ? cue.text : activePrompt
    }, calibrationPrompts[0].text)
  }
}
