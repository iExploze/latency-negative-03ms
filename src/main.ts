import './style.css'
import { CameraSystem } from './systems/CameraSystem'
import { DebugManager } from './systems/DebugManager'
import { EffectsRenderer } from './systems/EffectsRenderer'
import { FrameBuffer } from './systems/FrameBuffer'
import { MotionDetector, type MotionState } from './systems/MotionDetector'
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
const debugMode = new URLSearchParams(window.location.search).get('debug') === '1'
const camera = new CameraSystem(cameraVideo)
const frameBuffer = new FrameBuffer(240, 180, 30_000, 10)
const motionDetector = new MotionDetector()
const phaseManager = new PhaseManager(debugMode)
const renderer = new EffectsRenderer(mirrorCanvas)
const debugManager = new DebugManager(ui.elements.debugOverlay, new URLSearchParams(window.location.search))
let animationFrameId = 0
let hasStarted = false
let mismatchEvent: MismatchEvent | null = null
let lastMismatchAt = -Infinity

type MismatchEvent = {
  startedAt: number
  durationMs: number
  clipStartedAt: number
  freezeUntil: number
  frozenFrame: ImageData | null
}

const STILLNESS_TRIGGER_MS = 3500
const MISMATCH_COOLDOWN_MS = 15000
const MISMATCH_EVENT_DURATION_MS = 1800

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
    frameBuffer.clear()
    motionDetector.reset()
    mismatchEvent = null
    lastMismatchAt = -Infinity
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
  frameBuffer.clear()
  motionDetector.reset()
  mismatchEvent = null
  phaseManager.terminate(performance.now())
  hasStarted = false
  renderer.render({
    source: null,
    phase: phaseManager.getSnapshot(performance.now()),
    timestampMs: performance.now(),
    mismatchActive: false,
  })
  debugManager.clear()
  stopLoop()
  ui.showStart()
}

function startLoop(): void {
  stopLoop()

  const tick = (nowMs: number) => {
    const snapshot = phaseManager.getSnapshot(nowMs)
    const isCameraReady = camera.isReady

    if (isCameraReady) {
      frameBuffer.maybeCapture(cameraVideo, nowMs)
    }

    const motionState = isCameraReady ? motionDetector.updateFromVideo(cameraVideo, nowMs) : motionDetector.getState()
    updateMismatchEvent(snapshot.id, nowMs, motionState)

    const mismatchFrame = mismatchEvent
      ? getMismatchFrame(nowMs)
      : null
    const delayedFrame = snapshot.id === 'delay' || snapshot.id === 'mismatch'
      ? frameBuffer.getFrameAtDelay(nowMs, snapshot.delayMs)
      : null
    const source = mismatchFrame ?? delayedFrame ?? (isCameraReady ? cameraVideo : null)
    const renderSource = mismatchFrame ? 'mismatch' : delayedFrame ? 'delayed' : 'live'

    renderer.render({
      source,
      phase: snapshot,
      timestampMs: nowMs,
      mismatchActive: mismatchEvent !== null,
    })
    ui.updateHud(snapshot)
    debugManager.update({
      phase: snapshot.id,
      elapsedMs: snapshot.elapsedMs,
      delayMs: snapshot.delayMs,
      bufferFrameCount: frameBuffer.getFrameCount(),
      renderSource,
      motionScore: motionState.score,
      isStill: motionState.isStill,
      stillnessMs: motionState.stillnessMs,
      mismatchActive: mismatchEvent !== null,
    })

    if (hasStarted) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)
}

function updateMismatchEvent(phaseId: string, nowMs: number, motionState: MotionState): void {
  if (mismatchEvent && nowMs - mismatchEvent.startedAt >= mismatchEvent.durationMs) {
    mismatchEvent = null
  }

  if (phaseId !== 'mismatch' || mismatchEvent || nowMs - lastMismatchAt < MISMATCH_COOLDOWN_MS) {
    return
  }

  if (motionState.stillnessMs >= STILLNESS_TRIGGER_MS) {
    const clipStartedAt = Math.max(0, nowMs - 18_000)
    mismatchEvent = {
      startedAt: nowMs,
      durationMs: MISMATCH_EVENT_DURATION_MS,
      clipStartedAt,
      freezeUntil: nowMs + 260,
      frozenFrame: frameBuffer.getFrameAtDelay(nowMs, 1500),
    }
    lastMismatchAt = nowMs
  }
}

function getMismatchFrame(nowMs: number): ImageData | null {
  if (!mismatchEvent) {
    return null
  }

  if (nowMs <= mismatchEvent.freezeUntil) {
    return mismatchEvent.frozenFrame
  }

  const eventElapsedMs = nowMs - mismatchEvent.startedAt
  return frameBuffer.getNearestFrame(mismatchEvent.clipStartedAt + eventElapsedMs * 0.75)
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
