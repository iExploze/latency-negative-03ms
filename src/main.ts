import './style.css'
import { AudioManager, type AudioCue } from './systems/AudioManager'
import { CameraSystem } from './systems/CameraSystem'
import { DebugManager } from './systems/DebugManager'
import { DialogueManager } from './systems/DialogueManager'
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
const dialogueManager = new DialogueManager(debugMode)
const renderer = new EffectsRenderer(mirrorCanvas)
const audio = new AudioManager()
const debugManager = new DebugManager(ui.elements.debugOverlay, new URLSearchParams(window.location.search))
let animationFrameId = 0
let hasStarted = false
let mismatchEvent: MismatchEvent | null = null
let lastMismatchAt = -Infinity
let predictionEvent: PredictionEvent | null = null
let predictionTriggeredForPhase = false
let predictionRecoveryUntil = 0
let weirdEvent: WeirdEvent | null = null
let nextWeirdEventAt = 0
let lastPromptText = ''
let lastLiveQuestion = false
let lastAudioEvent = 'none'
const lastAudioCueAt = new Map<AudioCue, number>()
let finalCompleteShown = false

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
type WeirdEventMode = 'freeze' | 'oldFlash' | 'delayCut' | 'flipPulse' | 'shadowPulse' | 'scanBurst' | 'zoomPulse'
type TransferMode = 'none' | 'oldFrame' | 'clip' | 'liveBurst' | 'frozen' | 'warped'

type WeirdEvent = {
  startedAt: number
  durationMs: number
  mode: WeirdEventMode
  frame: ImageData | null
}

type TransferSource = {
  source: CanvasImageSource | ImageData | null
  mode: TransferMode
}

const STILLNESS_TRIGGER_MS = 2400
const MISMATCH_COOLDOWN_MS = 15000
const MISMATCH_EVENT_DURATION_MS = 1100
const MISMATCH_FREEZE_MS = 140
const MISMATCH_CLIP_LOOKBACK_MS = 14_000
const MISMATCH_CLIP_SPEED = 1.55
const HAND_CLIP_NAME = 'calibrationHandRaise'
const HAND_CLIP_MAX_FRAMES = 70
const CALIBRATION_TIME_SCALE = debugMode ? 10_000 / 60_000 : 45_000 / 60_000
const HAND_CAPTURE_START_MS = 30_000 * CALIBRATION_TIME_SCALE
const HAND_CAPTURE_END_MS = 38_000 * CALIBRATION_TIME_SCALE
const PREDICTION_EVENT_DURATION_MS = 3200
const PREDICTION_FREEZE_MS = 150
const PREDICTION_CLIP_LOOKBACK_MS = 16_000
const PREDICTION_CLIP_SPEED = 1.9

ui.showStart()

ui.elements.startButton.addEventListener('click', () => {
  void requestFullscreenBestEffort()
  void audio.unlock()
  void beginTest()
})

ui.elements.retryButton.addEventListener('click', () => {
  void beginTest()
})

ui.elements.privacyButton.addEventListener('click', () => ui.showPrivacy())
ui.elements.privacyCloseButton.addEventListener('click', () => ui.closePrivacy())
ui.elements.privacyBackButton.addEventListener('click', () => ui.closePrivacy())
ui.elements.audioTestButton.addEventListener('click', () => {
  void audio.unlock().then(() => audio.play('test'))
})
ui.elements.muteButton.addEventListener('click', () => {
  const muted = audio.toggleMute()
  ui.elements.muteButton.setAttribute('aria-pressed', String(muted))
  ui.elements.muteButton.textContent = muted ? 'UNMUTE' : 'MUTE'
})
ui.elements.exitButton.addEventListener('click', () => exitTest())
ui.elements.closeMirrorButton.addEventListener('click', () => closeMirror())
ui.updateDialogue(dialogueManager.update('idle', 0), (choiceId) => selectDialogueChoice(choiceId))
window.addEventListener('beforeunload', () => cleanupCameraOnly())
window.addEventListener('pagehide', () => cleanupCameraOnly())

async function beginTest(): Promise<void> {
  ui.closePrivacy()
  ui.showRequesting()

  try {
    await camera.requestAccess()
    frameBuffer.clear()
    motionDetector.reset()
    dialogueManager.reset()
    mismatchEvent = null
    predictionEvent = null
    predictionTriggeredForPhase = false
    predictionRecoveryUntil = 0
    weirdEvent = null
    nextWeirdEventAt = 0
    lastPromptText = ''
    lastLiveQuestion = false
    lastAudioEvent = 'none'
    finalCompleteShown = false
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
  dialogueManager.reset()
  mismatchEvent = null
  predictionEvent = null
  predictionTriggeredForPhase = false
  predictionRecoveryUntil = 0
  weirdEvent = null
  nextWeirdEventAt = 0
  lastPromptText = ''
  lastLiveQuestion = false
  lastAudioEvent = 'none'
  finalCompleteShown = false
  audio.stop()
  phaseManager.terminate(performance.now())
  hasStarted = false
  renderer.render({
    source: null,
    phase: phaseManager.getSnapshot(performance.now()),
    timestampMs: performance.now(),
    mismatchActive: false,
    predictionActive: false,
    weirdActive: false,
    weirdMode: 'none',
    transferMode: 'none',
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
    updateWeirdEvent(snapshot.id, nowMs)
    const dialogueSnapshot = dialogueManager.update(snapshot.id, snapshot.elapsedMs)

    if (dialogueSnapshot.readyForExit) {
      phaseManager.startReflectionExit(nowMs)
    }

    if (snapshot.id === 'finalComplete') {
      showFinalComplete()
      return
    }

    const mismatchFrame = mismatchEvent
      ? getMismatchFrame(nowMs)
      : null
    const predictionFrame = predictionEvent
      ? getPredictionFrame(nowMs)
      : null
    const predictionUsesExtraFlip = predictionEvent?.source === 'oppositeHandFromRightHandClip'
    const weirdFrame = weirdEvent
      ? getWeirdFrame()
      : null
    const weirdUsesExtraFlip = weirdEvent?.mode === 'flipPulse'
    const delayedFrame = snapshot.id === 'delay' || snapshot.id === 'mismatch' || snapshot.id === 'reflectionDialogue'
      ? frameBuffer.getFrameAtDelay(nowMs, snapshot.delayMs)
      : null
    const transferSource = snapshot.id === 'reflectionExit'
      ? getTransferSource(snapshot.elapsedMs, nowMs, isCameraReady ? cameraVideo : null)
      : { source: null, mode: 'none' as TransferMode }
    const source = predictionFrame ?? mismatchFrame ?? weirdFrame ?? transferSource.source ?? delayedFrame ?? (isCameraReady ? cameraVideo : null)
    const renderSource = predictionFrame ? 'prediction' : mismatchFrame ? 'mismatch' : transferSource.source ? 'transfer' : weirdFrame || delayedFrame ? 'delayed' : 'live'
    const predictionEventActive = predictionEvent !== null
    const weirdEventActive = weirdEvent !== null
    const predictionVisualActive = predictionEventActive || nowMs < predictionRecoveryUntil
    const liveState = getLiveState(snapshot.id, snapshot.elapsedMs, nowMs)
    updateAudioState(snapshot.id, snapshot.prompt, liveState.isQuestion, mismatchEvent !== null, predictionEventActive, weirdEventActive, transferSource.mode)

    renderer.render({
      source,
      phase: snapshot,
      timestampMs: nowMs,
      mismatchActive: mismatchEvent !== null,
      predictionActive: predictionVisualActive,
      weirdActive: weirdEventActive,
      weirdMode: weirdEvent?.mode ?? 'none',
      transferMode: transferSource.mode,
      extraHorizontalFlip: predictionUsesExtraFlip || weirdUsesExtraFlip,
    })
    ui.updateHud(snapshot, liveState.label)
    ui.updateDialogue(dialogueSnapshot, (choiceId) => selectDialogueChoice(choiceId))
    debugManager.update({
      phase: snapshot.id,
      activeEvent: getActiveEventLabel(snapshot.id, mismatchEvent !== null, predictionEventActive, weirdEventActive, dialogueSnapshot.active),
      weirdEventActive,
      weirdEventMode: weirdEvent?.mode ?? 'none',
      transferMode: transferSource.mode,
      audioEvent: lastAudioEvent,
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
      dialogueActive: dialogueSnapshot.active,
      dialogueLineId: dialogueSnapshot.lineId,
      dialogueLineIndex: dialogueSnapshot.lineIndex,
      dialogueText: dialogueSnapshot.text,
      selectedChoiceId: dialogueSnapshot.selectedChoiceId,
      exitSequenceActive: snapshot.id === 'reflectionExit',
      returnSequenceActive: snapshot.id === 'return',
      finalEndActive: snapshot.id === 'finalEnd',
      stillnessTriggerMs: STILLNESS_TRIGGER_MS,
      mismatchDurationMs: MISMATCH_EVENT_DURATION_MS,
      jitterIntensityPx: renderer.getJitterIntensity(snapshot.id, mismatchEvent !== null || predictionVisualActive),
    })

    if (hasStarted) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)
}

function showFinalComplete(): void {
  if (finalCompleteShown) {
    return
  }

  finalCompleteShown = true
  camera.stop()
  frameBuffer.clear()
  audio.stop()
  ui.updateDialogue(dialogueManager.update('idle', 0), (choiceId) => selectDialogueChoice(choiceId))
  ui.showFinalComplete()
  hasStarted = false
  stopLoop()
}

function closeMirror(): void {
  playAudio('final')
  camera.stop()
  frameBuffer.clear()
  motionDetector.reset()
  dialogueManager.reset()
  predictionEvent = null
  predictionTriggeredForPhase = false
  predictionRecoveryUntil = 0
  weirdEvent = null
  nextWeirdEventAt = 0
  lastAudioEvent = 'none'
  audio.stop()
  phaseManager.closeMirror(performance.now())
  ui.showWrongSide()
  debugManager.clear()
  hasStarted = false
  stopLoop()

  window.setTimeout(() => {
    window.close()
  }, 900)

  window.setTimeout(() => {
    ui.showCloseFallback()
  }, 1700)

  window.setTimeout(() => {
    ui.showFinalEnd()
  }, 6200)
}

function selectDialogueChoice(choiceId: string): void {
  const snapshot = phaseManager.getSnapshot(performance.now())
  dialogueManager.selectChoice(choiceId, snapshot.elapsedMs)
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
    predictionRecoveryUntil = 0
    return
  }

  if (predictionEvent && nowMs - predictionEvent.startedAt >= predictionEvent.durationMs) {
    predictionEvent = null
    predictionRecoveryUntil = nowMs + 420
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
  predictionRecoveryUntil = 0
  playAudio('negative')
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
    playAudio('mismatch')
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

function getWeirdFrame(): ImageData | null {
  if (!weirdEvent) {
    return null
  }

  if (weirdEvent.mode === 'freeze' || weirdEvent.mode === 'oldFlash' || weirdEvent.mode === 'delayCut') {
    return weirdEvent.frame
  }

  return null
}

function updateWeirdEvent(phaseId: string, nowMs: number): void {
  if (weirdEvent && nowMs - weirdEvent.startedAt >= weirdEvent.durationMs) {
    weirdEvent = null
  }

  const canGlitch = phaseId === 'mismatch'
    || phaseId === 'negativeLatency'
    || phaseId === 'reflectionDialogue'
    || phaseId === 'reflectionExit'

  if (!canGlitch) {
    weirdEvent = null
    nextWeirdEventAt = nowMs + 4000
    return
  }

  if (weirdEvent || nowMs < nextWeirdEventAt) {
    return
  }

  const mode = getNextWeirdMode(phaseId, nowMs)
  const durationMs = getWeirdDuration(phaseId, mode, nowMs)
  const frame = mode === 'oldFlash'
    ? frameBuffer.getFrameAtDelay(nowMs, 2500 + Math.abs(Math.sin(nowMs * 0.003)) * 18_000)
    : mode === 'delayCut'
      ? frameBuffer.getFrameAtDelay(nowMs, 650 + Math.abs(Math.cos(nowMs * 0.004)) * 1900)
      : mode === 'freeze'
        ? frameBuffer.getFrameAtDelay(nowMs, 120)
        : null

  weirdEvent = {
    startedAt: nowMs,
    durationMs,
    mode,
    frame,
  }
  playAudio('glitch')
  nextWeirdEventAt = nowMs + getNextWeirdDelay(phaseId, nowMs)
}

function getNextWeirdMode(phaseId: string, nowMs: number): WeirdEventMode {
  const modes: WeirdEventMode[] = phaseId === 'reflectionExit'
    ? ['oldFlash', 'delayCut', 'freeze', 'flipPulse', 'shadowPulse', 'scanBurst', 'zoomPulse']
    : phaseId === 'reflectionDialogue'
      ? ['oldFlash', 'delayCut', 'shadowPulse', 'scanBurst']
      : phaseId === 'negativeLatency'
        ? ['delayCut', 'flipPulse', 'zoomPulse', 'oldFlash']
        : ['freeze', 'delayCut', 'scanBurst']
  const index = Math.floor(Math.abs(Math.sin(nowMs * 0.0017)) * modes.length) % modes.length
  return modes[index]
}

function getWeirdDuration(phaseId: string, mode: WeirdEventMode, nowMs: number): number {
  const base = mode === 'freeze' ? 180 : mode === 'oldFlash' ? 220 : mode === 'flipPulse' ? 140 : 260
  const extra = Math.abs(Math.sin(nowMs * 0.0023)) * (phaseId === 'reflectionExit' ? 360 : 180)
  return base + extra
}

function getNextWeirdDelay(phaseId: string, nowMs: number): number {
  const randomish = Math.abs(Math.cos(nowMs * 0.0019))

  if (phaseId === 'reflectionExit') {
    return 650 + randomish * 900
  }

  if (phaseId === 'reflectionDialogue') {
    return 2600 + randomish * 2800
  }

  if (phaseId === 'negativeLatency') {
    return 2100 + randomish * 2500
  }

  return 3500 + randomish * 4200
}

function getTransferSource(phaseElapsedMs: number, nowMs: number, liveSource: CanvasImageSource | null): TransferSource {
  const intervalMs = getTransferSwitchIntervalMs(phaseElapsedMs)
  const slot = Math.floor(phaseElapsedMs / intervalMs)
  const transferProgress = Math.min(1, phaseElapsedMs / (debugMode ? 24_000 : 42_000))

  if (liveSource && slot % (transferProgress > 0.66 ? 4 : 6) === 2) {
    return { source: liveSource, mode: 'liveBurst' }
  }

  if (slot % 7 === 4) {
    return {
      source: frameBuffer.getFrameAtDelay(nowMs, 120 + Math.abs(Math.sin(slot)) * 400),
      mode: 'frozen',
    }
  }

  if (frameBuffer.getClipFrameCount(HAND_CLIP_NAME) >= 12 && slot % 5 === 0) {
    const clipProgress = Math.abs(Math.sin(slot * 0.77 + phaseElapsedMs * 0.0012))
    return { source: frameBuffer.getClipFrameAtProgress(HAND_CLIP_NAME, clipProgress), mode: 'clip' }
  }

  const hash = Math.abs(Math.sin(slot * 12.9898 + 78.233))
  const secondaryHash = Math.abs(Math.cos(slot * 4.187 + 19.19))
  const lookbackMs = 700 + hash * 25_000
  const driftMs = (secondaryHash - 0.5) * 1100
  return {
    source: frameBuffer.getFrameAtDelay(nowMs, lookbackMs + driftMs),
    mode: slot % 3 === 0 ? 'warped' : 'oldFrame',
  }
}

function getTransferSwitchIntervalMs(phaseElapsedMs: number): number {
  const transferProgress = Math.min(1, phaseElapsedMs / (debugMode ? 24_000 : 42_000))

  if (transferProgress < 0.34) {
    return 680 - transferProgress * 520
  }

  if (transferProgress < 0.72) {
    return 330 - (transferProgress - 0.34) * 560
  }

  return 130 - (transferProgress - 0.72) * 250
}

function getAvailablePredictionSource(): PredictionFootageSource {
  return frameBuffer.getClipFrameCount(HAND_CLIP_NAME) >= 12
    ? 'oppositeHandFromRightHandClip'
    : 'genericBufferFallback'
}

function getLiveState(phaseId: string, phaseElapsedMs: number, nowMs: number): { label: string; isQuestion: boolean } {
  if (phaseId === 'return') {
    const flicker = (phaseElapsedMs > 3500 && phaseElapsedMs < 4300) || (phaseElapsedMs > 11_000 && phaseElapsedMs < 11_650)
    return { label: flicker ? 'LIVE?' : 'LIVE', isQuestion: flicker }
  }

  if (phaseId !== 'negativeLatency' && phaseId !== 'reflectionDialogue') {
    return { label: 'LIVE', isQuestion: false }
  }

  const flicker = Math.sin(nowMs * 0.011) > 0.72 || Math.sin(nowMs * 0.027) > 0.84
  return { label: flicker ? 'LIVE?' : 'LIVE', isQuestion: flicker }
}

function updateAudioState(
  phaseId: string,
  prompt: string,
  liveQuestion: boolean,
  mismatchActive: boolean,
  predictionActive: boolean,
  weirdActive: boolean,
  transferMode: TransferMode,
): void {
  if (prompt && prompt !== lastPromptText) {
    playAudio('prompt')
    lastPromptText = prompt
  }

  if (liveQuestion && !lastLiveQuestion) {
    playAudio('liveFlicker')
  }
  lastLiveQuestion = liveQuestion

  if (transferMode !== 'none' && transferMode !== 'oldFrame') {
    playAudio('transfer')
  } else if (weirdActive) {
    playAudio('glitch')
  } else if (mismatchActive) {
    lastAudioEvent = 'mismatch'
  } else if (predictionActive) {
    lastAudioEvent = 'negative'
  }

  if (phaseId === 'reflectionExit') {
    audio.setRumble(0.55)
    return
  }

  if (phaseId === 'negativeLatency') {
    audio.setRumble(0.22)
    return
  }

  audio.setRumble(0)
}

function playAudio(cue: AudioCue): void {
  const nowMs = performance.now()
  const minInterval = cue === 'transfer'
    ? 520
    : cue === 'glitch'
      ? 320
      : cue === 'liveFlicker'
        ? 140
        : 0
  const lastPlayedAt = lastAudioCueAt.get(cue) ?? -Infinity

  if (nowMs - lastPlayedAt < minInterval) {
    return
  }

  audio.play(cue)
  lastAudioCueAt.set(cue, nowMs)
  lastAudioEvent = cue
}

async function requestFullscreenBestEffort(): Promise<void> {
  if (!document.fullscreenEnabled || document.fullscreenElement) {
    return
  }

  try {
    await document.documentElement.requestFullscreen()
  } catch {
    // Fullscreen is a recommendation, not a gate.
  }
}

function cleanupCameraOnly(): void {
  camera.stop()
  frameBuffer.clear()
}

function getActiveEventLabel(
  phaseId: string,
  mismatchActive: boolean,
  predictionActive: boolean,
  weirdActive: boolean,
  dialogueActive: boolean,
): string {
  if (mismatchActive) {
    return 'mismatch'
  }

  if (predictionActive) {
    return 'prediction'
  }

  if (weirdActive) {
    return 'weird'
  }

  if (dialogueActive) {
    return 'dialogue'
  }

  if (phaseId === 'reflectionExit') {
    return 'transfer'
  }

  if (phaseId === 'return') {
    return 'return'
  }

  return 'none'
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
