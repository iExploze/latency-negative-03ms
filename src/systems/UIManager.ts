import type { DiagnosticReadouts, PhaseSnapshot } from './PhaseManager'

type UIElements = {
  startScreen: HTMLElement
  privacyModal: HTMLElement
  deniedScreen: HTMLElement
  gameScreen: HTMLElement
  startButton: HTMLButtonElement
  privacyButton: HTMLButtonElement
  privacyCloseButton: HTMLButtonElement
  privacyBackButton: HTMLButtonElement
  audioTestButton: HTMLButtonElement
  retryButton: HTMLButtonElement
  exitButton: HTMLButtonElement
  liveLabel: HTMLElement
  timer: HTMLElement
  phaseLabel: HTMLElement
  prompt: HTMLElement
  diagnostics: HTMLElement
  debugOverlay: HTMLElement
  deniedTitle: HTMLElement
  deniedMessage: HTMLElement
}

export class UIManager {
  public readonly elements: UIElements

  public constructor(root: HTMLElement) {
    root.innerHTML = this.getMarkup()
    this.elements = this.queryElements(root)
  }

  public showStart(): void {
    this.setScreen('start')
    this.closePrivacy()
  }

  public showPrivacy(): void {
    this.elements.privacyModal.classList.remove('hidden')
    this.elements.privacyModal.setAttribute('aria-hidden', 'false')
  }

  public closePrivacy(): void {
    this.elements.privacyModal.classList.add('hidden')
    this.elements.privacyModal.setAttribute('aria-hidden', 'true')
  }

  public showRequesting(): void {
    this.setScreen('game')
    this.elements.phaseLabel.textContent = 'REQUESTING MIRROR ACCESS'
    this.elements.prompt.textContent = 'Requesting mirror access...'
    this.elements.diagnostics.innerHTML = this.formatDiagnostics({
      latency: '--',
      reflection: 'pending',
      subject: 'unknown',
      sync: 'pending',
    })
  }

  public showGame(): void {
    this.setScreen('game')
  }

  public showDenied(title: string, message: string): void {
    this.setScreen('denied')
    this.elements.deniedTitle.textContent = title
    this.elements.deniedMessage.textContent = message
  }

  public updateHud(snapshot: PhaseSnapshot, liveLabel = 'LIVE'): void {
    this.elements.liveLabel.textContent = snapshot.id === 'terminated' ? 'OFFLINE' : liveLabel
    this.elements.liveLabel.classList.toggle('live-question', liveLabel === 'LIVE?')
    this.elements.timer.textContent = this.formatTimer(snapshot.elapsedMs)
    this.elements.phaseLabel.textContent = snapshot.label
    this.elements.prompt.textContent = snapshot.prompt
    this.elements.diagnostics.innerHTML = this.formatDiagnostics(snapshot.diagnostics)
  }

  private setScreen(screen: 'start' | 'denied' | 'game'): void {
    this.elements.startScreen.classList.toggle('hidden', screen !== 'start')
    this.elements.deniedScreen.classList.toggle('hidden', screen !== 'denied')
    this.elements.gameScreen.classList.toggle('hidden', screen !== 'game')
  }

  private formatTimer(elapsedMs: number): string {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private formatDiagnostics(diagnostics: DiagnosticReadouts): string {
    return Object.entries(diagnostics)
      .map(([key, value]) => `<div><span>${key}:</span> ${value}</div>`)
      .join('')
  }

  private queryElements(root: HTMLElement): UIElements {
    return {
      startScreen: this.getElement(root, '#start-screen'),
      privacyModal: this.getElement(root, '#privacy-modal'),
      deniedScreen: this.getElement(root, '#denied-screen'),
      gameScreen: this.getElement(root, '#game-screen'),
      startButton: this.getElement(root, '#begin-test'),
      privacyButton: this.getElement(root, '#privacy-note'),
      privacyCloseButton: this.getElement(root, '#privacy-understood'),
      privacyBackButton: this.getElement(root, '#privacy-back'),
      audioTestButton: this.getElement(root, '#audio-test'),
      retryButton: this.getElement(root, '#try-again'),
      exitButton: this.getElement(root, '#exit-test'),
      liveLabel: this.getElement(root, '#live-label'),
      timer: this.getElement(root, '#timer'),
      phaseLabel: this.getElement(root, '#phase-label'),
      prompt: this.getElement(root, '#prompt'),
      diagnostics: this.getElement(root, '#diagnostics'),
      debugOverlay: this.getElement(root, '#debug-overlay'),
      deniedTitle: this.getElement(root, '#denied-title'),
      deniedMessage: this.getElement(root, '#denied-message'),
    }
  }

  private getElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
    const element = root.querySelector<T>(selector)

    if (!element) {
      throw new Error(`Missing UI element: ${selector}`)
    }

    return element
  }

  private getMarkup(): string {
    return `
      <section id="start-screen" class="screen start-screen">
        <div class="screen-noise" aria-hidden="true"></div>
        <div class="start-copy">
          <p class="eyebrow">LOCAL MIRROR CALIBRATION</p>
          <h1>Latency: -03ms</h1>
          <p class="subtitle">A mirror calibration experiment.</p>
          <p class="safety-note">Contains mild visual distortion and webcam-based horror.</p>
          <div class="start-actions" aria-label="Start actions">
            <button id="begin-test" type="button">BEGIN TEST</button>
            <button id="privacy-note" type="button" class="secondary">PRIVACY NOTE</button>
            <button id="audio-test" type="button" class="secondary">AUDIO TEST</button>
          </div>
          <p class="footer-note">Best experienced on desktop with a webcam and headphones.</p>
        </div>
      </section>

      <section id="privacy-modal" class="modal-shell hidden" aria-hidden="true" aria-modal="true" role="dialog" aria-labelledby="privacy-title">
        <div class="modal">
          <p class="eyebrow">CAMERA PRIVACY</p>
          <h2 id="privacy-title">Local mirror access</h2>
          <p>This game uses your webcam locally to create a live mirror effect.</p>
          <p>No video is uploaded.</p>
          <p>No microphone access is requested.</p>
          <p>The camera stops when the test ends or the page closes.</p>
          <div class="modal-actions">
            <button id="privacy-understood" type="button">UNDERSTOOD</button>
            <button id="privacy-back" type="button" class="secondary">BACK</button>
          </div>
        </div>
      </section>

      <section id="denied-screen" class="screen denied-screen hidden">
        <div>
          <p class="eyebrow">MIRROR ACCESS FAILED</p>
          <h2 id="denied-title">Reflection unavailable.</h2>
          <p id="denied-message">Subject refused observation.</p>
          <button id="try-again" type="button">TRY AGAIN</button>
        </div>
      </section>

      <section id="game-screen" class="game-screen hidden">
        <video id="camera-video" class="camera-video" playsinline muted></video>
        <canvas id="mirror-canvas" class="mirror-canvas" aria-label="Mirrored webcam feed"></canvas>
        <div class="hud" aria-live="polite">
          <div class="hud-top">
            <div>
              <div id="live-label" class="live-label">LIVE</div>
              <div id="timer" class="timer">00:00</div>
            </div>
            <div id="phase-label" class="phase-label">CALIBRATION: 0%</div>
          </div>
          <div id="prompt" class="prompt">Please center yourself in the frame.</div>
          <div id="diagnostics" class="diagnostics"></div>
        </div>
        <button id="exit-test" type="button" class="exit-button">EXIT TEST</button>
      </section>

      <section id="debug-overlay" class="debug-overlay hidden" aria-label="Debug overlay"></section>
    `
  }
}
