import './style.css'
import { CameraSystem } from './systems/CameraSystem'
import { DebugManager } from './systems/DebugManager'
import { EffectsRenderer } from './systems/EffectsRenderer'
import { FrameBuffer, type BufferedFrame } from './systems/FrameBuffer'
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
let predictionEvent: PredictionEvent | null = null
let predictionTriggeredForPhase = false

type MismatchEvent = {
  startedAt: number
  durationMs: number
  clipStartedAt: number
  freezeUntil: number
  frozenFrame: ImageData | null
}

type PredictionEvent = {
  startedAt: number
  durationMs: number
  clipStartedAt: number
  freezeUntil: number
  frozenFrame: ImageData | null
  source: PredictionFootageSource
}

type PredictionFootageSource = 'oppositeHandFromRightHandClip' | 'rightHandClip' | 'genericBufferFallback'

const STILLNESS_TRIGGER_MS = 2400
const MISMATCH_COOLDOWN_MS = 15000
const MISMATCH_EVENT_DURATION_MS = 1100
const MISMATCH_FREEZE_MS = 140
const MISMATCH_CLIP_LOOKBACK_MS = 14_000
const MISMATCH_CLIP_SPEED = 1.55
const HAND_CLIP_NAME = 'calibrationHandRaise'
const HAND_CLIP_MAX_FRAMES = 70
const HAND_CAPTURE_START_MS = debugMode ? 5_000 : 30_000
const HAND_CAPTURE_END_MS = debugMode ? 6_350 : 38_000
const PREDICTION_EVENT_DURATION_MS = 1650
const PREDICTION_FREEZE_MS = 180
const PREDICTION_CLIP_LOOKBACK_MS = 16_000
const PREDICTION_CLIP_SPEED = 1.9

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
    predictionEvent = null
    predictionTriggeredForPhase = false
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
  predictionEvent = null
  predictionTriggeredForPhase = false
  phaseManager.terminate(performance.now())
  hasStarted = false
  renderer.render({
    source: null,
    phase: phaseManager.getSnapshot(performance.now()),
    timestampMs: performance.now(),
    mismatchActive: false,
    predictionActive: false,
    extraHorizontalFlip: false,
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
      const capturedFrame = frameBuffer.maybeCapture(cameraVideo, nowMs)

      if (capturedFrame) {
        captureCalibrationClips(snapshot.id, snapshot.elapsedMs, capturedFrame)
      }
    }

    const motionState = isCameraReady ? motionDetector.updateFromVideo(cameraVideo, nowMs) : motionDetector.getState()
    updateMismatchEvent(snapshot.id, nowMs, motionState)
    updatePredictionEvent(snapshot.id, snapshot.elapsedMs, nowMs)

    const mismatchFrame = mismatchEvent
      ? getMismatchFrame(nowMs)
      : null
    const predictionFrame = predictionEvent
      ? getPredictionFrame(nowMs)
      : null
    const predictionUsesExtraFlip = predictionEvent?.source === 'oppositeHandFromRightHandClip'
    const delayedFrame = snapshot.id === 'delay' || snapshot.id === 'mismatch'
      ? frameBuffer.getFrameAtDelay(nowMs, snapshot.delayMs)
      : null
    const source = predictionFrame ?? mismatchFrame ?? delayedFrame ?? (isCameraReady ? cameraVideo : null)
    const renderSource = predictionFrame ? 'prediction' : mismatchFrame ? 'mismatch' : delayedFrame ? 'delayed' : 'live'
    const predictionEventActive = predictionEvent !== null
    const liveState = getLiveState(snapshot.id, nowMs)

    renderer.render({
      source,
      phase: snapshot,
      timestampMs: nowMs,
      mismatchActive: mismatchEvent !== null,
      predictionActive: predictionEventActive,
      extraHorizontalFlip: predictionUsesExtraFlip,
    })
    ui.updateHud(snapshot, liveState.label)
    debugManager.update({
      phase: snapshot.id,
      elapsedMs: snapshot.elapsedMs,
      delayMs: snapshot.delayMs,
      displayedLatencyMs: snapshot.displayedLatencyMs,
      bufferFrameCount: frameBuffer.getFrameCount(),
      renderSource,
      motionScore: motionState.score,
      isStill: motionState.isStill,
      stillnessMs: motionState.stillnessMs,
      mismatchActive: mismatchEvent !== null,
      negativeLatencyActive: snapshot.id === 'negativeLatency',
      predictionEventActive,
      predictionFootageSource: predictionEvent?.source ?? getAvailablePredictionSource(),
      liveFlickerActive: liveState.isQuestion,
      stillnessTriggerMs: STILLNESS_TRIGGER_MS,
      mismatchDurationMs: MISMATCH_EVENT_DURATION_MS,
      jitterIntensityPx: renderer.getJitterIntensity(snapshot.id, mismatchEvent !== null || predictionEventActive),
    })

    if (hasStarted) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)
}

function captureCalibrationClips(phaseId: string, phaseElapsedMs: number, frame: BufferedFrame): void {
  if (phaseId !== 'calibration') {
    return
  }

  if (phaseElapsedMs >= HAND_CAPTURE_START_MS && phaseElapsedMs <= HAND_CAPTURE_END_MS) {
    frameBuffer.addFrameToClip(HAND_CLIP_NAME, frame, HAND_CLIP_MAX_FRAMES)
  }
}

function updatePredictionEvent(phaseId: string, phaseElapsedMs: number, nowMs: number): void {
  if (phaseId !== 'negativeLatency') {
    predictionEvent = null
    predictionTriggeredForPhase = false
    return
  }

  if (predictionEvent && nowMs - predictionEvent.startedAt >= predictionEvent.durationMs) {
    predictionEvent = null
  }

  const predictionCueAt = debugMode ? 3_200 : 8_000
  const raisePromptAt = debugMode ? 4_800 : 12_000
  const promptIsPredictionCue = phaseElapsedMs >= predictionCueAt
  const promptHasAdvanced = phaseElapsedMs >= raisePromptAt

  if (predictionTriggeredForPhase || predictionEvent || !promptIsPredictionCue || promptHasAdvanced) {
    return
  }

  const source = getAvailablePredictionSource()
  predictionTriggeredForPhase = true
  predictionEvent = {
    startedAt: nowMs,
    durationMs: PREDICTION_EVENT_DURATION_MS,
    clipStartedAt: Math.max(0, nowMs - PREDICTION_CLIP_LOOKBACK_MS),
    freezeUntil: nowMs + PREDICTION_FREEZE_MS,
    frozenFrame: frameBuffer.getFrameAtDelay(nowMs, 700),
    source,
  }
}

function updateMismatchEvent(phaseId: string, nowMs: number, motionState: MotionState): void {
  if (mismatchEvent && nowMs - mismatchEvent.startedAt >= mismatchEvent.durationMs) {
    mismatchEvent = null
  }

  if (phaseId !== 'mismatch' || mismatchEvent || nowMs - lastMismatchAt < MISMATCH_COOLDOWN_MS) {
    return
  }

  if (motionState.stillnessMs >= STILLNESS_TRIGGER_MS) {
    const clipStartedAt = Math.max(0, nowMs - MISMATCH_CLIP_LOOKBACK_MS)
    mismatchEvent = {
      startedAt: nowMs,
      durationMs: MISMATCH_EVENT_DURATION_MS,
      clipStartedAt,
      freezeUntil: nowMs + MISMATCH_FREEZE_MS,
      frozenFrame: frameBuffer.getFrameAtDelay(nowMs, 1500),
    }
    lastMismatchAt = nowMs
  }
}

function getPredictionFrame(nowMs: number): ImageData | null {
  if (!predictionEvent) {
    return null
  }

  if (nowMs <= predictionEvent.freezeUntil) {
    return predictionEvent.frozenFrame
  }

  const eventElapsedMs = nowMs - predictionEvent.startedAt
  const activeDurationMs = Math.max(1, predictionEvent.durationMs - PREDICTION_FREEZE_MS)
  const progress = Math.min(1, Math.max(0, (eventElapsedMs - PREDICTION_FREEZE_MS) / activeDurationMs))

  if (
    predictionEvent.source === 'oppositeHandFromRightHandClip'
    || predictionEvent.source === 'rightHandClip'
  ) {
    return frameBuffer.getClipFrameAtProgress(HAND_CLIP_NAME, progress)
  }

  return frameBuffer.getNearestFrame(predictionEvent.clipStartedAt + eventElapsedMs * PREDICTION_CLIP_SPEED)
}

function getMismatchFrame(nowMs: number): ImageData | null {
  if (!mismatchEvent) {
    return null
  }

  if (nowMs <= mismatchEvent.freezeUntil) {
    return mismatchEvent.frozenFrame
  }

  const eventElapsedMs = nowMs - mismatchEvent.startedAt
  return frameBuffer.getNearestFrame(mismatchEvent.clipStartedAt + eventElapsedMs * MISMATCH_CLIP_SPEED)
}

function getAvailablePredictionSource(): PredictionFootageSource {
  return frameBuffer.getClipFrameCount(HAND_CLIP_NAME) >= 12
    ? 'oppositeHandFromRightHandClip'
    : 'genericBufferFallback'
}

function getLiveState(phaseId: string, nowMs: number): { label: string; isQuestion: boolean } {
  if (phaseId !== 'negativeLatency') {
    return { label: 'LIVE', isQuestion: false }
  }

  const flicker = Math.sin(nowMs * 0.011) > 0.72 || Math.sin(nowMs * 0.027) > 0.84
  return { label: flicker ? 'LIVE?' : 'LIVE', isQuestion: flicker }
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
