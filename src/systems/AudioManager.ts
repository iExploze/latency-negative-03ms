export type AudioCue =
  | 'prompt'
  | 'mismatch'
  | 'glitch'
  | 'liveFlicker'
  | 'negative'
  | 'transfer'
  | 'final'
  | 'test'

export class AudioManager {
  private context: AudioContext | null = null
  private muted = false
  private rumble: OscillatorNode | null = null
  private rumbleGain: GainNode | null = null

  public get isMuted(): boolean {
    return this.muted
  }

  public async unlock(): Promise<void> {
    const context = this.getContext()

    if (context.state === 'suspended') {
      await context.resume()
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted

    if (this.muted) {
      this.stopRumble()
    }

    return this.muted
  }

  public play(cue: AudioCue): void {
    if (this.muted) {
      return
    }

    const context = this.getContext()

    if (context.state === 'suspended') {
      return
    }

    if (cue === 'prompt') {
      this.beep(520, 0.035, 0.028, 'sine')
      return
    }

    if (cue === 'mismatch') {
      this.beep(118, 0.22, 0.06, 'sawtooth')
      this.noise(0.09, 0.035)
      return
    }

    if (cue === 'glitch') {
      this.beep(880, 0.045, 0.035, 'square')
      this.noise(0.065, 0.05)
      return
    }

    if (cue === 'liveFlicker') {
      this.beep(1220, 0.035, 0.04, 'square')
      return
    }

    if (cue === 'negative') {
      this.beep(176, 0.18, 0.045, 'triangle')
      return
    }

    if (cue === 'transfer') {
      this.beep(72, 0.32, 0.08, 'sawtooth')
      this.noise(0.12, 0.055)
      return
    }

    if (cue === 'final') {
      this.beep(92, 0.08, 0.045, 'sine')
      return
    }

    this.beep(176, 1.8, 0.08, 'sine', 88)
  }

  public setRumble(intensity: number): void {
    if (this.muted || intensity <= 0) {
      this.stopRumble()
      return
    }

    const context = this.getContext()

    if (context.state === 'suspended') {
      return
    }

    if (!this.rumble || !this.rumbleGain) {
      this.rumble = context.createOscillator()
      this.rumbleGain = context.createGain()
      this.rumble.type = 'sine'
      this.rumble.frequency.value = 46
      this.rumbleGain.gain.value = 0
      this.rumble.connect(this.rumbleGain)
      this.rumbleGain.connect(context.destination)
      this.rumble.start()
    }

    this.rumble.frequency.setTargetAtTime(42 + intensity * 24, context.currentTime, 0.22)
    this.rumbleGain.gain.setTargetAtTime(0.012 + intensity * 0.045, context.currentTime, 0.2)
  }

  public stop(): void {
    this.stopRumble()
  }

  private getContext(): AudioContext {
    this.context ??= new AudioContext()
    return this.context
  }

  private beep(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    endFrequency = frequency,
  ): void {
    const context = this.getContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), context.currentTime + duration)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration + 0.01)
  }

  private noise(duration: number, volume: number): void {
    const context = this.getContext()
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }

    const source = context.createBufferSource()
    const gain = context.createGain()
    gain.gain.value = volume
    source.buffer = buffer
    source.connect(gain)
    gain.connect(context.destination)
    source.start()
  }

  private stopRumble(): void {
    if (!this.rumble || !this.rumbleGain || !this.context) {
      return
    }

    this.rumbleGain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.08)
    this.rumble.stop(this.context.currentTime + 0.18)
    this.rumble = null
    this.rumbleGain = null
  }
}
