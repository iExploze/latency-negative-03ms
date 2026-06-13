export type DebugSnapshot = {
  phase: string
  elapsedMs: number
  delayMs: number
  bufferFrameCount: number
  renderSource: 'live' | 'delayed'
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
      <div><span>bufferFrames:</span> ${snapshot.bufferFrameCount}</div>
      <div><span>renderSource:</span> ${snapshot.renderSource}</div>
    `
  }

  public clear(): void {
    if (this.enabled) {
      this.element.innerHTML = ''
      this.element.classList.add('hidden')
    }
  }
}
