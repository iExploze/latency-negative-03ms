import './style.css'
import { CameraSystem } from './systems/CameraSystem'
import { EffectsRenderer } from './systems/EffectsRenderer'
import { PhaseManager } from './systems/PhaseManager'
import { UIManager } from './systems/UIManager'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing app root.')
}

const ui = new UIManager(app)
const video = document.querySelector<HTMLVideoElement>('#camera-video')
const canvas = document.querySelector<HTMLCanvasElement>('#mirror-canvas')

if (!video || !canvas) {
  throw new Error('Missing mirror video or canvas.')
}

const cameraVideo = video
const mirrorCanvas = canvas
const camera = new CameraSystem(cameraVideo)
const phaseManager = new PhaseManager()
const renderer = new EffectsRenderer(mirrorCanvas)
let animationFrameId = 0
let hasStarted = false

ui.showStart()

ui.elements.startButton.addEventListener('click', () => {
  void beginTest()
})

ui.elements.retryButton.addEventListener('click', () => {
  void beginTest()
})

ui.elements.privacyButton.addEventListener('click', () => ui.showPrivacy())
ui.elements.privacyCloseButton.addEventListener('click', () => ui.closePrivacy())
ui.elements.privacyBackButton.addEventListener('click', () => ui.closePrivacy())
ui.elements.audioTestButton.addEventListener('click', () => playAudioTest())
ui.elements.exitButton.addEventListener('click', () => exitTest())
window.addEventListener('beforeunload', () => camera.stop())

async function beginTest(): Promise<void> {
  ui.closePrivacy()
  ui.showRequesting()

  try {
    await camera.requestAccess()
    hasStarted = true
    phaseManager.start(performance.now())
    ui.showGame()
    startLoop()
  } catch (error) {
    hasStarted = false
    stopLoop()
    showCameraError(error)
  }
}

function exitTest(): void {
  camera.stop()
  phaseManager.terminate(performance.now())
  hasStarted = false
  renderer.render({
    video: cameraVideo,
    phase: phaseManager.getSnapshot(performance.now()),
    isCameraReady: false,
  })
  stopLoop()
  ui.showStart()
}

function startLoop(): void {
  stopLoop()

  const tick = (nowMs: number) => {
    const snapshot = phaseManager.getSnapshot(nowMs)

    renderer.render({
      video: cameraVideo,
      phase: snapshot,
      isCameraReady: camera.isReady,
    })
    ui.updateHud(snapshot)

    if (hasStarted) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)
}

function stopLoop(): void {
  if (animationFrameId !== 0) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }
}

function showCameraError(error: unknown): void {
  if (camera.status === 'unsupported') {
    ui.showDenied('Browser does not support mirror access.', 'Please use desktop Chrome or Edge.')
    return
  }

  if (camera.status === 'denied') {
    ui.showDenied('Reflection unavailable.', 'Subject refused observation.')
    return
  }

  const message = error instanceof DOMException && error.name === 'NotFoundError'
    ? 'The test requires a camera.'
    : 'Mirror initialization failed.'
  ui.showDenied('No reflection device found.', message)
}

function playAudioTest(): void {
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(176, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(88, context.currentTime + 1.8)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 2)
}
