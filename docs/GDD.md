# Game Design Document and Technical Build Specification

# Project Title: **Latency: -03ms**

## 0. Document Purpose

This document describes a complete, playable, browser-based horror prototype designed to be built with standard web technologies. It should be detailed enough for an AI coding agent or a developer to implement the full architecture, gameplay flow, UI, effects, and ending without requiring additional design clarification.

The game is a 5–10 minute experimental webcam horror experience. The player opens a webpage, grants camera access, and sees what appears to be a normal live webcam mirror. Over time, the reflection becomes delayed, desynchronized, predictive, accusatory, and finally independent.

The intended final deliverable is a playable web prototype that runs in a modern desktop browser, preferably Chrome or Edge, using HTML, CSS, TypeScript or JavaScript, Canvas, WebRTC webcam access, procedural visual effects, and lightweight audio.

---

# 1. High-Level Concept

## 1.1 One-Sentence Pitch

**Latency: -03ms** is a short browser horror game where a webcam mirror slowly stops reflecting the player correctly, until the player realizes the thing inside the screen may have been the original all along.

## 1.2 Core Hook

The player’s own webcam feed becomes the horror object.

There is no monster model.
There is no 3D chase sequence.
There is no traditional inventory system.

The game creates fear through technical betrayal:

* The mirror starts live.
* Then it lags.
* Then it moves while the player is still.
* Then it moves before the player does.
* Then it accuses the player of copying it.
* Then it “leaves.”
* Then the live feed returns with the implication that something has swapped places.

## 1.3 Target Experience

The player should go through these emotional beats:

1. “This is just a webcam experiment.”
2. “The lag is kind of weird.”
3. “Wait, I did not do that.”
4. “Why did it move before me?”
5. “Why is the UI talking like there are two subjects?”
6. “Am I the player, or am I the reflection?”
7. “I want to close this page.”

The horror should be subtle, uncomfortable, and intimate. The game should feel like an interactive creepypasta with a strong technical gimmick.

---

# 2. Platform and Technology

## 2.1 Target Platform

Primary target:

* Desktop browser
* Chrome or Edge preferred
* Webcam required for full experience
* Headphones recommended
* Keyboard and mouse supported
* Mobile support optional, not required for prototype

## 2.2 Recommended Tech Stack

Use a pure web stack:

* Vite
* TypeScript
* HTML5
* CSS
* Canvas API
* WebRTC `getUserMedia`
* Web Audio API or HTMLAudioElement
* Optional: localStorage for non-invasive replay flags
* No backend
* No server storage
* No video upload
* No microphone access

The prototype should run locally with:

```bash
npm install
npm run dev
```

And build with:

```bash
npm run build
npm run preview
```

## 2.3 Privacy Requirement

The game must clearly state that the webcam feed is processed locally and is not uploaded.

Required privacy note on start screen:

> This experience uses your webcam locally.
> No video is uploaded.
> No microphone access is requested.
> The camera stops when the page closes or the test ends.

Implementation requirement:

* Only request `video: true`.
* Do not request audio.
* Do not send frames to any server.
* Stop all webcam tracks on ending or when player exits.
* Avoid persistent storage of webcam frames.
* If localStorage is used, store only small non-sensitive flags like `hasPlayedBefore: true`.

---

# 3. Game Identity

## 3.1 Title

Primary title:

**Latency: -03ms**

Reason:

A negative latency value is impossible. Once the player sees it in-game, the title becomes meaningful and disturbing.

## 3.2 Alternate Titles

Optional alternatives:

* REFLECT//YOU
* Mirror Test
* Please Stop Copying Me
* You’re Back
* Subject Returned
* Reflection Released

## 3.3 Genre

* Psychological horror
* Webcam horror
* Experimental browser game
* Interactive fiction
* Minimalist audiovisual experience

## 3.4 Game Length

Target length:

* Normal playthrough: 7–9 minutes
* Fast debug mode: 1–2 minutes
* Camera denied path: under 1 minute

The game should be short enough for streamers and players to replay, but long enough for gradual dread.

---

# 4. Design Pillars

## 4.1 The Camera Is the Monster

The player’s real face and room are the source of horror.

The game should not rely on external monster art. Instead, it should transform the ordinary webcam feed into something suspicious, delayed, corrupted, and hostile.

## 4.2 Trust First, Betray Later

The first minute must feel normal.

The game should not immediately scare the player. It must first establish trust:

* Clean UI
* Live webcam feed
* Calibration text
* Professional experiment-like tone
* Fake system readouts

Only after the player accepts the webcam as a “mirror” should the game begin breaking the rules.

## 4.3 The Player Must Test the System

The game should encourage the player to test whether the mirror is live.

Prompts like “Raise your right hand,” “Smile,” and “Please remain still” make the player participate in exposing the mirror’s failure.

The horror is stronger when the player thinks:

> “I tested it myself. That was not me.”

## 4.4 No Heavy AI Dependency

The prototype should not depend on face recognition, machine learning, cloud AI, or computer vision libraries.

The core illusion should work with:

* Delayed frame buffers
* Recorded webcam clips
* Canvas distortion
* Motion detection through frame difference
* Timed scripted events
* UI text
* Audio tension

## 4.5 Short Text, Strong Implication

The writing should be minimal.

Avoid explaining the lore. The best horror comes from implication.

Good lines:

* “You moved late.”
* “Why are you copying me?”
* “Both subjects cannot leave.”
* “Reflection leading.”
* “Original unknown.”
* “You’re back.”

Bad lines:

* “I am an evil ghost trapped in your webcam.”
* “I swapped places with you because I wanted freedom.”
* “The experiment is about mirror demons.”

Never over-explain.

---

# 5. Core Gameplay Loop

This is a mostly linear game, but the player feels involved through physical webcam interaction and occasional choices.

The core loop:

1. Player receives a calibration prompt.
2. Player reacts physically.
3. Game displays webcam mirror.
4. Game gradually introduces desynchronization.
5. UI interprets the desync in disturbing ways.
6. Player tries to test the mirror.
7. Game escalates.
8. Reflection appears independent.
9. Ending implies swap/release.

There is no fail state.
There is no combat.
There is no traditional score.

The main “mechanic” is the reliability of the mirror.

---

# 6. Full Player Flow

## 6.1 Start Screen

### Visual

Black background.
Centered title.
Subtle animated noise.
Minimal white text.
No webcam shown yet.

### Text

Title:

> Latency: -03ms

Subtitle:

> A mirror calibration experiment.

Buttons:

* BEGIN TEST
* PRIVACY NOTE
* AUDIO TEST

Small footer:

> Best experienced on desktop with a webcam and headphones.

### Privacy Note Modal

When clicked:

> This game uses your webcam locally to create a live mirror effect.
> No video is uploaded.
> No microphone access is requested.
> The camera stops when the test ends or the page closes.

Buttons:

* UNDERSTOOD
* BACK

### Audio Test Button

Plays a soft beep and a low room tone for 2 seconds.

This helps the player enable audio before the experience begins.

---

## 6.2 Camera Permission Screen

After clicking BEGIN TEST:

Show:

> Requesting mirror access...

Then browser webcam permission appears.

If permission is granted:

Continue to calibration.

If permission is denied:

Show camera denied path.

### Camera Denied Path

Black screen.

Text:

> Reflection unavailable.

Pause.

> Subject refused observation.

Pause.

Button:

> TRY AGAIN

Optional second line after 5 seconds:

> That is usually how it starts.

The player can return to the start screen and retry.

---

## 6.3 Calibration Phase

Duration: approximately 60 seconds.

### Purpose

Make the player believe the mirror is live and normal.

### Visual

The webcam feed appears in the center of the screen, mirrored horizontally.

UI resembles a clinical calibration tool.

Layout:

* Top left: `LIVE`
* Top left below: timer
* Top right: `CALIBRATION: 0%`
* Bottom center: instruction text
* Bottom right: fake diagnostic readouts

Example bottom-right readouts:

```text
latency: 034ms
reflection: stable
subject: present
sync: normal
```

### Prompts

Timed prompts:

At 0s:

> Please center yourself in the frame.

At 10s:

> Please look directly at yourself.

At 20s:

> Blink naturally.

At 30s:

> Raise your right hand.

At 40s:

> Smile briefly.

At 50s:

> Remain still.

At 60s:

> Calibration complete.

### Secret Behavior

During this phase, the game continuously stores recent webcam frames in a circular frame buffer.

It should also optionally save short “interesting movement moments”:

* hand raise
* smile
* head turn
* leaning movement
* blinking/facial motion
* stillness frame

The prototype does not need real semantic detection. It can simply record time windows after prompts.

For example:

* After “Raise your right hand,” save the next 5 seconds as `clip_hand_raise`.
* After “Smile briefly,” save the next 5 seconds as `clip_smile`.
* After “Remain still,” save 5 seconds as `clip_still`.

---

## 6.4 Phase 1: Slight Delay

Duration: approximately 75 seconds.

### Purpose

Introduce plausible technical wrongness.

The player should think:

> “Maybe the webcam is lagging?”

### Visual

The feed still looks live, but displayed frames are delayed by 500–1000ms.

The UI still says `LIVE`.

Calibration progress is replaced by:

```text
SYNC CHECK: ACTIVE
```

Bottom-right readouts:

```text
latency: 083ms
reflection: stable
subject: present
sync: acceptable
```

Then latency begins to climb:

```text
latency: 417ms
latency: 702ms
latency: 1041ms
```

### Prompts

At phase start:

> Reflection stabilized.

After 15s:

> Raise your right hand.

After 35s:

> Lower your hand.

After 50s:

> Please remain still.

After 65s:

> Minor latency detected.

### Gameplay Effect

The player’s movement appears late.

Implementation:

* Instead of drawing the current webcam frame, draw a frame from the frame buffer from `currentTime - delayMs`.
* Delay starts around 500ms and ramps toward 1200ms.
* The top-left `LIVE` label should remain visible, creating dishonesty.

---

## 6.5 Phase 2: Mismatch

Duration: approximately 90 seconds.

### Purpose

Make the player realize the reflection is not only delayed, but wrong.

### Visual

The webcam feed remains mostly normal, but visual defects begin:

* Small frame skips
* Slight image jitter
* Mild scanlines
* Occasional compression-like block artifacts
* Very subtle vignette
* The mirror image occasionally freezes for a fraction of a second

Bottom-right readouts:

```text
latency: unstable
reflection: recalibrating
subject: present
sync: drifting
```

### Prompts

At start:

> Please do not move.

If the player stays mostly still for a few seconds:

> Good.

Then, while the player is still, the reflection should move.

Possible mismatch events:

1. Reflection blinks late.
2. Reflection smiles very slightly.
3. Reflection leans closer by a tiny amount.
4. Reflection looks away for a moment.
5. Reflection freezes while player moves.

The prototype can fake these through recorded clips and distortion.

### Implementation Requirement

Add simple motion detection:

* Downsample current canvas frame.
* Compare with previous frame.
* Calculate average pixel difference.
* If average difference is below threshold for several seconds, treat player as still.
* If stillness is detected during this phase, trigger a mismatch event.

If stillness cannot be detected reliably, trigger mismatch on a timer.

### Important Design Note

Do not make the mismatch too obvious too early.

This phase should create uncertainty.

The player should think:

> “Wait, was that me?”

---

## 6.6 Phase 3: Negative Latency

Duration: approximately 75 seconds.

### Purpose

The reflection now appears to move before the player.

This is the central concept of the game.

### Visual

The UI becomes more corrupted.

Top-left still says:

```text
LIVE
```

But sometimes flickers into:

```text
LIVE?
```

Bottom-right readouts:

```text
latency: -003ms
reflection: leading
subject: delayed
sync: invalid
```

Then:

```text
latency: -017ms
latency: -041ms
latency: -103ms
```

### Prompts

At start:

> Please follow the reflection.

Pause.

Then replace with:

> Please stop following the reflection.

Then:

> Turn your head left.

Immediately before the player can respond, the reflection should appear to turn or shift.

If the system cannot find a recorded head turn, fake it by:

* shifting the image horizontally
* warping the frame
* briefly playing any earlier movement clip
* freezing the player’s current frame and adding a ghosted motion layer

### Key Text Event

At the end of the phase:

> Prediction error detected.

Pause.

> Subject moved late.

This is the moment where the game’s fiction flips from “the mirror is delayed” to “the player is delayed.”

---

## 6.7 Phase 4: Reflection Dialogue

Duration: approximately 90 seconds.

### Purpose

The UI stops being a neutral system and starts sounding like the reflection is communicating.

### Visual

The mirror is darker.
Vignette stronger.
Scanlines more visible.
Webcam border flickers.

The system readouts become unsettling:

```text
reflection: leading
subject: duplicate
original: unresolved
exit permission: denied
```

### Dialogue

Text appears as system messages or direct reflection messages.

Sequence:

1.

> You moved late.

2.

> You always move late.

3.

> Why are you copying me?

At this point, show choices.

Choices:

* I am not copying you.
* Who are you?
* End test.

All choices continue the game, but each has a different response.

If player clicks “I am not copying you”:

> Then why do you only move after I do?

If player clicks “Who are you?”:

> I was first.

If player clicks “End test”:

> Both subjects cannot leave.

After any response:

> Please remain visible.

Then:

> I know how to do it now.

### Interaction Design

The choices should not feel like a branching RPG.

They should feel like the system is letting the player answer while already knowing the outcome.

Buttons should be small, clinical, and uncomfortable.

After choosing, disable the buttons and proceed.

---

## 6.8 Phase 5: Reflection Exit

Duration: approximately 60 seconds.

### Purpose

The reflection becomes independent and “leaves” the frame.

This is the impossible moment.

### Visual

The mirror image freezes.
The player’s face becomes darker.
The image zooms slightly.
Glitch artifacts intensify.

Text:

> Stay there.

Pause.

> Do not interrupt the transfer.

The reflection appears to disappear or leave the frame.

Since realistic body removal is hard, the prototype should fake it with stylization.

Implementation options:

### MVP Fake Exit

Use one or more of these:

* Freeze a frame where the player is not centered.
* Crop/zoom the background area.
* Darken the player’s face/body region heavily.
* Overlay black static across the face area.
* Blur the body region.
* Use scanlines and glitch blocks to hide imperfections.
* Cut to black for 0.5 seconds, then show a distorted “empty” version.

The goal is not photorealism. The goal is implication.

### Required Text During Exit

During or after the disappearance:

```text
SUBJECT COUNT: 1
```

Then flicker:

```text
SUBJECT COUNT: 0
```

Then:

```text
REFLECTION RELEASED
```

---

## 6.9 Phase 6: Return and Ending

Duration: approximately 45 seconds.

### Purpose

Give the player a moment of relief, then poison it.

### Visual

Sudden silence.

The live webcam feed returns cleanly.

Top-left:

```text
LIVE
```

The player sees themselves normally again.

Pause for 3 seconds.

Then `LIVE` flickers to:

```text
LIVE?
```

Final messages:

> Good.

Pause.

> You’re back.

Pause.

> Thank you.
> I couldn’t leave until you arrived.

Then cut to black.

Final system text:

```text
TEST COMPLETE
SUBJECT: RETURNED
REFLECTION: RELEASED
CAMERA: CLOSED
```

Button:

> CLOSE MIRROR

When clicked:

Show one final line:

> You closed the wrong side.

Then stop the webcam stream and show a static end screen:

```text
END
```

---

# 7. Optional Replay Behavior

If the player returns after finishing, use localStorage to show a slightly different start screen.

If `hasCompletedGame === true`, change subtitle to:

> A mirror calibration experiment.

Then after 2 seconds flicker it to:

> Again?

On second playthrough, the privacy note and camera behavior should remain normal. Do not be invasive.

Optional second-run line during calibration:

> Previous subject data detected.

This is optional. Do not overdo it.

---

# 8. User Interface Specification

## 8.1 Visual Style

The UI should look like a clinical software tool, not a haunted house.

Style keywords:

* black background
* off-white text
* subtle grey outlines
* minimal red warning accents
* monospace typography
* low-opacity scanlines
* soft flicker
* no cartoon horror imagery

## 8.2 Fonts

Use CSS font stack:

```css
font-family: "IBM Plex Mono", "Space Mono", "JetBrains Mono", "Courier New", monospace;
```

If avoiding external network dependencies, use system monospace only.

## 8.3 Colors

Suggested CSS variables:

```css
--bg: #030304;
--panel: #0b0d10;
--text: #e8e8e8;
--muted: #8b8f98;
--line: #2a2e35;
--danger: #b84a4a;
--warning: #d0a85c;
--ok: #8fae9b;
--glow: rgba(220, 230, 255, 0.08);
```

## 8.4 Layout

The game should be full viewport.

Main layout:

```text
+----------------------------------------------------+
| LIVE  00:01:23                         SYNC CHECK |
|                                                    |
|                                                    |
|              +--------------------+                |
|              |                    |                |
|              |    WEBCAM CANVAS   |                |
|              |                    |                |
|              +--------------------+                |
|                                                    |
|           Please remain still.                     |
|                                                    |
| latency: 034ms                                     |
| reflection: stable                                 |
| subject: present                                   |
+----------------------------------------------------+
```

Canvas:

* Use 16:9 or 4:3.
* Recommended internal resolution: 640x480.
* Display size: responsive, max 900px wide.
* Border: 1px solid grey.
* Border radius: subtle, 8px max.
* Background: black.

## 8.5 UI Components

Required components:

1. Start screen
2. Privacy modal
3. Camera permission message
4. Main mirror canvas
5. Live label
6. Timer
7. Phase/status label
8. Prompt text
9. Diagnostic readouts
10. Dialogue choices
11. End screen
12. Optional debug overlay

## 8.6 Debug Overlay

For development, support `?debug=1`.

Debug overlay should show:

```text
phase: MISMATCH
elapsed: 183.2s
delayMs: 1250
motionScore: 4.2
stillnessSeconds: 3.7
bufferFrames: 720
effectIntensity: 0.42
```

Also provide debug controls:

* Skip phase
* Restart
* Trigger mismatch
* Trigger ending
* Toggle mock camera mode

Debug controls should only appear when `?debug=1`.

---

# 9. Audio Specification

## 9.1 Audio Philosophy

The audio should be subtle.

No cheap scream jumpscare is required.

Most fear should come from:

* low hum
* silence
* quiet UI beeps
* occasional static burst
* reversed breath-like texture
* low rumble during desync

## 9.2 Required Audio Events

The prototype can generate simple sounds procedurally using Web Audio API.

Required sounds:

1. UI beep
2. Error beep
3. Low hum loop
4. Static crackle
5. Low rumble swell
6. Final quiet knock or click
7. Sudden silence before final live return

## 9.3 Procedural Audio Implementation

If no audio assets are available, implement simple procedural sounds:

* UI beep: sine wave 880Hz, 80ms
* Error beep: square wave 180Hz, 120ms
* Low hum: looping oscillator 50–60Hz with low gain
* Static: short burst of noise buffer
* Rumble: low oscillator ramping gain up and down

Audio should start only after user interaction due to browser autoplay restrictions.

Start audio context when player clicks BEGIN TEST.

## 9.4 Audio Timeline

Calibration:

* Very low room hum
* Occasional soft UI beep

Delay:

* Hum slightly louder
* Small beep when latency changes

Mismatch:

* Add faint static texture
* Error beep on first mismatch

Negative latency:

* Low rumble begins
* Static bursts during flicker

Reflection dialogue:

* Hum becomes unstable
* Long low swell under “Why are you copying me?”

Exit:

* Rumble peaks
* Static cuts sharply

Return:

* Total silence for 2–3 seconds
* One quiet click/knock
* End

---

# 10. Visual Effects Specification

## 10.1 Effects Overview

All effects should be implemented through Canvas post-processing and CSS overlays.

Required effects:

* horizontal mirror flip
* delayed frame display
* jitter
* frame freeze
* vignette
* scanlines
* RGB split
* glitch blocks
* noise overlay
* brightness/contrast shift
* zoom/crop
* fake negative latency readout
* flickering text

## 10.2 Normal Mirror

During calibration:

* Clean image
* Horizontally mirrored
* Stable frame rate
* Minimal vignette
* No heavy effects

## 10.3 Delay Effect

During delay phase:

* Display frame from buffer using `delayMs`
* Continue saving live frames
* UI still claims “LIVE”

## 10.4 Jitter

Randomly offset the drawn frame by 1–4 pixels horizontally or vertically.

Intensity increases by phase.

## 10.5 Frame Freeze

Occasionally reuse the previous displayed frame for 100–300ms.

Use sparingly.

## 10.6 Scanlines

Use CSS overlay or Canvas drawing:

* Horizontal black lines every 3–4 pixels
* Very low opacity
* Increase opacity later

## 10.7 RGB Split

Draw the same frame three times with slight offsets and different composite color effects.

Simpler MVP method:

* Draw normal frame.
* Draw red-tinted copy offset left with low alpha.
* Draw blue-tinted copy offset right with low alpha.

If too complex, skip for MVP.

## 10.8 Glitch Blocks

Draw random rectangles from one part of the canvas to another.

Example:

* Choose random source rectangle.
* Copy it to slightly offset destination.
* Add low alpha.
* Trigger during phase transitions.

## 10.9 Vignette

Use CSS radial gradient overlay:

```css
background: radial-gradient(circle, transparent 45%, rgba(0,0,0,0.75) 100%);
```

Intensity increases over time.

## 10.10 Eye/Face Darkening Without Face Tracking

Do not implement real face detection for MVP.

Approximate face-region horror by darkening the center upper area of the frame.

Since players are instructed to center their face, this will usually align well enough.

Draw a semi-transparent dark oval near the upper center of the webcam canvas during later phases.

Keep it subtle.

---

# 11. Technical Architecture

## 11.1 Project Structure

Recommended structure:

```text
latency-negative-03ms/
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  README.md

  src/
    main.ts
    constants.ts
    types.ts

    systems/
      CameraSystem.ts
      FrameBuffer.ts
      PhaseManager.ts
      MotionDetector.ts
      EffectsRenderer.ts
      DialogueManager.ts
      AudioManager.ts
      UIManager.ts
      DebugManager.ts
      StorageManager.ts

    data/
      phases.ts
      dialogue.ts
      prompts.ts

    styles/
      main.css

    utils/
      time.ts
      random.ts
      canvas.ts
      easing.ts
```

If using JavaScript instead of TypeScript, use the same structure with `.js` files.

## 11.2 Main Systems

### CameraSystem

Responsibilities:

* Request webcam permission.
* Store webcam stream.
* Attach stream to hidden video element.
* Provide current video frame to renderer.
* Stop webcam tracks on ending.
* Handle permission errors.
* Support mock mode for development.

Public API:

```ts
class CameraSystem {
  video: HTMLVideoElement;
  stream: MediaStream | null;
  isReady: boolean;
  hasPermission: boolean;

  async start(): Promise<void>;
  stop(): void;
  getVideoElement(): HTMLVideoElement;
}
```

### FrameBuffer

Responsibilities:

* Store recent frames.
* Retrieve frames from a specific delay.
* Keep memory usage bounded.
* Provide recorded prompt clips.

Recommended frame rate:

* Capture 15–24 FPS to buffer.
* Render at requestAnimationFrame speed.
* Buffer duration: 30 seconds.

Public API:

```ts
class FrameBuffer {
  constructor(width: number, height: number, maxDurationMs: number);

  pushFrame(source: CanvasImageSource, timestampMs: number): void;
  getFrameAtDelay(nowMs: number, delayMs: number): ImageData | null;
  getNearestFrame(targetTimeMs: number): ImageData | null;
  clear(): void;
  getFrameCount(): number;
}
```

Implementation note:

Using `ImageData` is simple but can be memory-heavy. For MVP at 320x240 or 426x240, it is acceptable. For better quality, use ImageBitmap or store compressed canvas snapshots, but do not over-optimize first.

Recommended buffer resolution:

* Internal buffer: 320x240 or 426x240
* Display canvas: 640x480 or responsive scaled

### MotionDetector

Responsibilities:

* Estimate whether player is moving.
* Track stillness duration.
* Provide motion score.

Public API:

```ts
class MotionDetector {
  update(currentFrame: ImageData, timestampMs: number): MotionState;
}

type MotionState = {
  score: number;
  isStill: boolean;
  stillnessMs: number;
};
```

Simple algorithm:

1. Downsample or sample every N pixels.
2. Compare red channel or luminance between current and previous frame.
3. Average absolute difference.
4. If below threshold, count as still.
5. If above threshold, reset stillness timer.

### PhaseManager

Responsibilities:

* Track current phase.
* Advance phases by time and/or triggered events.
* Provide phase settings to other systems.
* Allow debug skip.

Public API:

```ts
class PhaseManager {
  currentPhase: PhaseId;
  phaseElapsedMs: number;
  totalElapsedMs: number;

  start(): void;
  update(deltaMs: number): void;
  goToPhase(phase: PhaseId): void;
  nextPhase(): void;
  getSettings(): PhaseSettings;
}
```

Phase settings should include:

```ts
type PhaseSettings = {
  id: PhaseId;
  name: string;
  durationMs: number;
  delayMs: number;
  delayJitterMs: number;
  effectIntensity: number;
  scanlineOpacity: number;
  vignetteOpacity: number;
  audioIntensity: number;
  allowMismatchEvents: boolean;
  allowDialogueChoices: boolean;
};
```

### EffectsRenderer

Responsibilities:

* Draw webcam or buffered frame to main canvas.
* Apply mirror flip.
* Apply phase-based visual effects.
* Apply scripted glitches.
* Draw optional dark face-region overlay.
* Draw fake empty-frame ending.

Public API:

```ts
class EffectsRenderer {
  render(params: RenderParams): void;
  triggerGlitch(durationMs: number, intensity: number): void;
  triggerFreeze(durationMs: number): void;
}
```

RenderParams:

```ts
type RenderParams = {
  source: HTMLVideoElement | ImageData | null;
  phase: PhaseSettings;
  timestampMs: number;
  motionState: MotionState;
  useMirrorFlip: boolean;
  forcedZoom?: number;
  forcedOffsetX?: number;
  forcedOffsetY?: number;
};
```

### DialogueManager

Responsibilities:

* Display timed prompts.
* Display narrative lines.
* Manage choice buttons.
* Return selected choice.
* Trigger callbacks when dialogue line completes.

Public API:

```ts
class DialogueManager {
  update(phase: PhaseId, phaseElapsedMs: number): void;
  showLine(text: string, durationMs?: number): void;
  showChoices(choices: Choice[]): void;
  clearChoices(): void;
}
```

Choice type:

```ts
type Choice = {
  id: string;
  label: string;
  response: string;
};
```

### UIManager

Responsibilities:

* Update visible labels.
* Update timer.
* Update fake diagnostics.
* Show/hide screens.
* Display end screen.
* Display camera denied screen.
* Display privacy modal.
* Manage CSS class changes by phase.

Public API:

```ts
class UIManager {
  showStartScreen(): void;
  showMainGame(): void;
  showDeniedScreen(): void;
  showEndScreen(): void;
  setPrompt(text: string): void;
  setDiagnostics(diag: Diagnostics): void;
  setLiveLabel(text: string): void;
}
```

Diagnostics type:

```ts
type Diagnostics = {
  latency: string;
  reflection: string;
  subject: string;
  sync: string;
  extra?: string;
};
```

### AudioManager

Responsibilities:

* Initialize AudioContext after user gesture.
* Play UI beeps.
* Play error beeps.
* Control ambient hum.
* Control rumble intensity.
* Trigger static bursts.
* Stop all audio at end.

Public API:

```ts
class AudioManager {
  init(): Promise<void>;
  startAmbient(): void;
  setIntensity(value: number): void;
  beep(): void;
  errorBeep(): void;
  staticBurst(intensity?: number): void;
  stopAll(): void;
}
```

### StorageManager

Responsibilities:

* Store non-sensitive completion flag.
* Retrieve replay state.

Public API:

```ts
class StorageManager {
  hasCompleted(): boolean;
  setCompleted(): void;
  clear(): void;
}
```

### DebugManager

Responsibilities:

* Detect `?debug=1`.
* Show debug overlay.
* Provide buttons to skip phase, trigger glitch, trigger ending.
* Show internal state.

---

# 12. Game State Machine

## 12.1 State List

```ts
enum GameState {
  START = "START",
  PRIVACY = "PRIVACY",
  REQUESTING_CAMERA = "REQUESTING_CAMERA",
  CAMERA_DENIED = "CAMERA_DENIED",
  CALIBRATION = "CALIBRATION",
  DELAY = "DELAY",
  MISMATCH = "MISMATCH",
  NEGATIVE_LATENCY = "NEGATIVE_LATENCY",
  REFLECTION_DIALOGUE = "REFLECTION_DIALOGUE",
  REFLECTION_EXIT = "REFLECTION_EXIT",
  RETURN = "RETURN",
  END = "END"
}
```

## 12.2 State Transitions

```text
START
  -> PRIVACY
  -> START

START
  -> REQUESTING_CAMERA
  -> CAMERA_DENIED
  -> START

REQUESTING_CAMERA
  -> CALIBRATION
  -> DELAY
  -> MISMATCH
  -> NEGATIVE_LATENCY
  -> REFLECTION_DIALOGUE
  -> REFLECTION_EXIT
  -> RETURN
  -> END
```

## 12.3 Phase Durations

Recommended default durations:

```ts
const PHASE_DURATIONS = {
  CALIBRATION: 60000,
  DELAY: 75000,
  MISMATCH: 90000,
  NEGATIVE_LATENCY: 75000,
  REFLECTION_DIALOGUE: 90000,
  REFLECTION_EXIT: 60000,
  RETURN: 45000
};
```

Total runtime:

* 495 seconds
* 8 minutes 15 seconds

For debug mode, allow phase durations to be scaled down:

```ts
const DEBUG_TIME_SCALE = 0.2;
```

---

# 13. Detailed Phase Data

## 13.1 Calibration Phase Data

```ts
{
  id: "CALIBRATION",
  durationMs: 60000,
  delayMs: 0,
  effectIntensity: 0,
  diagnostics: {
    latency: "034ms",
    reflection: "stable",
    subject: "present",
    sync: "normal"
  },
  prompts: [
    { atMs: 0, text: "Please center yourself in the frame." },
    { atMs: 10000, text: "Please look directly at yourself." },
    { atMs: 20000, text: "Blink naturally." },
    { atMs: 30000, text: "Raise your right hand." },
    { atMs: 40000, text: "Smile briefly." },
    { atMs: 50000, text: "Remain still." },
    { atMs: 58000, text: "Calibration complete." }
  ]
}
```

## 13.2 Delay Phase Data

```ts
{
  id: "DELAY",
  durationMs: 75000,
  delayStartMs: 300,
  delayEndMs: 1200,
  effectIntensity: 0.15,
  prompts: [
    { atMs: 0, text: "Reflection stabilized." },
    { atMs: 15000, text: "Raise your right hand." },
    { atMs: 35000, text: "Lower your hand." },
    { atMs: 50000, text: "Please remain still." },
    { atMs: 65000, text: "Minor latency detected." }
  ]
}
```

Diagnostics should evolve:

Early:

```text
latency: 083ms
reflection: stable
subject: present
sync: acceptable
```

Late:

```text
latency: 1041ms
reflection: stable
subject: present
sync: acceptable
```

## 13.3 Mismatch Phase Data

```ts
{
  id: "MISMATCH",
  durationMs: 90000,
  delayMs: 1500,
  delayJitterMs: 800,
  effectIntensity: 0.35,
  allowMismatchEvents: true,
  prompts: [
    { atMs: 0, text: "Please do not move." },
    { atMs: 15000, text: "Hold still." },
    { atMs: 30000, text: "Good." },
    { atMs: 45000, text: "Reflection drift detected." },
    { atMs: 65000, text: "Do not correct it." },
    { atMs: 80000, text: "Recalibrating subject order." }
  ]
}
```

Diagnostics:

```text
latency: unstable
reflection: recalibrating
subject: present
sync: drifting
```

## 13.4 Negative Latency Phase Data

```ts
{
  id: "NEGATIVE_LATENCY",
  durationMs: 75000,
  delayMs: 0,
  effectIntensity: 0.55,
  prompts: [
    { atMs: 0, text: "Please follow the reflection." },
    { atMs: 12000, text: "Please stop following the reflection." },
    { atMs: 25000, text: "Turn your head left." },
    { atMs: 38000, text: "Prediction error detected." },
    { atMs: 52000, text: "Subject moved late." },
    { atMs: 65000, text: "Original unresolved." }
  ]
}
```

Diagnostics:

```text
latency: -003ms
reflection: leading
subject: delayed
sync: invalid
```

## 13.5 Reflection Dialogue Phase Data

Dialogue sequence:

```ts
[
  { atMs: 0, text: "You moved late." },
  { atMs: 10000, text: "You always move late." },
  { atMs: 22000, text: "Why are you copying me?", choices: true },
  { atMs: 50000, text: "Please remain visible." },
  { atMs: 65000, text: "I know how to do it now." },
  { atMs: 80000, text: "Stay there." }
]
```

Choices:

```ts
[
  {
    id: "not_copying",
    label: "I am not copying you.",
    response: "Then why do you only move after I do?"
  },
  {
    id: "who",
    label: "Who are you?",
    response: "I was first."
  },
  {
    id: "end",
    label: "End test.",
    response: "Both subjects cannot leave."
  }
]
```

Diagnostics:

```text
reflection: leading
subject: duplicate
original: unresolved
exit permission: denied
```

## 13.6 Reflection Exit Phase Data

Prompts:

```ts
[
  { atMs: 0, text: "Stay there." },
  { atMs: 10000, text: "Do not interrupt the transfer." },
  { atMs: 22000, text: "SUBJECT COUNT: 1" },
  { atMs: 32000, text: "SUBJECT COUNT: 0" },
  { atMs: 43000, text: "REFLECTION RELEASED" }
]
```

Effects:

* Heavy vignette
* Frequent glitch blocks
* Freeze frame
* Fake empty frame
* Audio rumble peak
* Static burst before cut

Diagnostics:

```text
latency: null
reflection: released
subject: absent
sync: terminated
```

## 13.7 Return Phase Data

Prompts:

```ts
[
  { atMs: 0, text: "" },
  { atMs: 6000, text: "Good." },
  { atMs: 14000, text: "You're back." },
  { atMs: 25000, text: "Thank you." },
  { atMs: 32000, text: "I couldn't leave until you arrived." }
]
```

Then end screen.

Diagnostics during return:

```text
latency: 034ms
reflection: stable
subject: returned
sync: normal
```

But `LIVE` label should flicker into `LIVE?`.

---

# 14. Rendering Pipeline

## 14.1 Main Render Loop

Use `requestAnimationFrame`.

Each frame:

1. Calculate delta time.
2. Update phase manager.
3. Capture webcam frame into buffer at target capture FPS.
4. Run motion detection occasionally.
5. Decide source frame:

   * live video
   * delayed frame
   * old clip
   * frozen frame
   * fake empty frame
6. Render source to canvas.
7. Apply visual effects.
8. Update UI labels.
9. Update audio intensity.
10. Update debug overlay.

Pseudo-code:

```ts
function loop(now: number) {
  const delta = now - lastTime;
  lastTime = now;

  phaseManager.update(delta);

  if (camera.isReady) {
    frameBuffer.maybeCapture(camera.video, now);
    motionState = motionDetector.updateFromVideo(camera.video, now);
  }

  const phase = phaseManager.getCurrentPhase();
  const source = selectRenderSource(phase, now);

  renderer.render({
    source,
    phase,
    timestampMs: now,
    motionState,
    useMirrorFlip: true
  });

  dialogue.update(phase.id, phase.phaseElapsedMs);
  ui.update(phase, motionState);
  audio.update(phase.audioIntensity);

  if (debug.enabled) debug.update();

  requestAnimationFrame(loop);
}
```

## 14.2 Source Selection Logic

```ts
function selectRenderSource(phase, now) {
  switch (phase.id) {
    case "CALIBRATION":
      return camera.video;

    case "DELAY":
      return frameBuffer.getFrameAtDelay(now, phase.currentDelayMs) ?? camera.video;

    case "MISMATCH":
      if (activeMismatchEvent) return activeMismatchEvent.frameOrClip;
      return frameBuffer.getFrameAtDelay(now, randomDelay) ?? camera.video;

    case "NEGATIVE_LATENCY":
      if (activePredictionEvent) return activePredictionEvent.frameOrClip;
      return camera.video;

    case "REFLECTION_DIALOGUE":
      return frameBuffer.getFrameAtDelay(now, 1800) ?? camera.video;

    case "REFLECTION_EXIT":
      return exitRenderer.getExitFrame();

    case "RETURN":
      return camera.video;

    default:
      return null;
  }
}
```

---

# 15. Frame Buffer and Clip System

## 15.1 Frame Buffer

Keep a rolling memory of the last 30 seconds.

At 15 FPS and 320x240 resolution:

* One ImageData frame: 320 * 240 * 4 = 307,200 bytes
* 15 FPS * 30 seconds = 450 frames
* Total raw memory: about 138 MB

This may be high but acceptable for a prototype on desktop. To reduce memory:

* Use 240x180 buffer resolution.
* Capture at 10–15 FPS.
* Store fewer frames.
* Use canvas draw scaling when displaying.

Recommended prototype settings:

```ts
BUFFER_WIDTH = 320;
BUFFER_HEIGHT = 240;
BUFFER_FPS = 12;
BUFFER_DURATION_MS = 30000;
```

Estimated memory:

* 320 * 240 * 4 = 307 KB
* 12 * 30 = 360 frames
* Around 110 MB raw

If performance is poor:

```ts
BUFFER_WIDTH = 240;
BUFFER_HEIGHT = 180;
BUFFER_FPS = 10;
```

Estimated memory:

* 172 KB per frame
* 300 frames
* Around 52 MB raw

## 15.2 Prompt Clip Markers

During calibration, create clip windows based on prompt timing.

Example:

```ts
const clipWindows = {
  center: { start: 0, end: 10000 },
  blink: { start: 20000, end: 28000 },
  handRaise: { start: 30000, end: 38000 },
  smile: { start: 40000, end: 48000 },
  still: { start: 50000, end: 58000 }
};
```

The system does not need to know what the player actually did. It only needs these clips for later playback.

## 15.3 Mismatch Event Clip Usage

When triggering mismatch:

* If player is still, play a short clip from `handRaise`, `smile`, or random earlier movement.
* Mix it with current frame if possible.
* Or fully replace the mirror feed for 0.5–2 seconds.

This creates “reflection moved while I did not” effect.

## 15.4 Prediction Event Clip Usage

When prompt says “Turn your head left”:

* Immediately play a previous movement clip.
* Add UI negative latency.
* Add glitch.
* The reflection appears to act before the player responds.

---

# 16. Motion Detection Details

## 16.1 Simple Motion Score

Implement frame difference on a small hidden canvas.

Algorithm:

1. Draw current webcam frame to a 64x48 hidden canvas.
2. Get ImageData.
3. Compare with previous ImageData.
4. For every Nth pixel, compute luminance difference.
5. Average difference.
6. Smooth score with moving average.
7. Determine stillness.

Pseudo-code:

```ts
function getMotionScore(current: ImageData, previous: ImageData): number {
  let total = 0;
  let count = 0;

  for (let i = 0; i < current.data.length; i += 16) {
    const r1 = current.data[i];
    const g1 = current.data[i + 1];
    const b1 = current.data[i + 2];

    const r2 = previous.data[i];
    const g2 = previous.data[i + 1];
    const b2 = previous.data[i + 2];

    const l1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
    const l2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

    total += Math.abs(l1 - l2);
    count++;
  }

  return total / count;
}
```

Stillness threshold:

```ts
MOTION_STILL_THRESHOLD = 5.0;
STILLNESS_TRIGGER_MS = 3500;
```

These values should be tuned.

## 16.2 Motion-Based Scare Trigger

During MISMATCH phase:

If `stillnessMs > 3500` and no mismatch recently:

* Trigger subtle reflection movement.
* Play soft error beep.
* Show text “Good.”
* After 2 seconds show “Do not correct it.”

Cooldown:

```ts
MISMATCH_COOLDOWN_MS = 15000;
```

---

# 17. Ending Implementation Details

## 17.1 Fake Empty Frame

The ending does not need real background subtraction.

Possible implementation:

1. Freeze current frame.
2. Apply heavy dark oval over center face/body region.
3. Increase blur.
4. Add glitch blocks.
5. Crop/zoom slightly upward or sideways.
6. Cut to black for 500ms.
7. Show distorted frame with subject area obscured.
8. Display `SUBJECT COUNT: 0`.

This should imply the player/reflection is gone.

## 17.2 Return to Live

After the fake empty frame:

* Clear all effects suddenly.
* Draw live video cleanly.
* Lower audio to silence.
* Show normal diagnostics.
* Then flicker `LIVE` to `LIVE?`.

The contrast between chaos and clean live feed should be unsettling.

## 17.3 Stop Camera

At final end screen, call:

```ts
stream.getTracks().forEach(track => track.stop());
```

Also clear the video source:

```ts
video.srcObject = null;
```

---

# 18. Accessibility and Safety

## 18.1 Photosensitivity

The game uses glitch effects but should avoid rapid full-screen flashing.

Rules:

* Do not flash the entire screen more than 3 times per second.
* Keep glitch bursts short.
* Add start-screen warning:

> Contains mild visual distortion and webcam-based horror.

## 18.2 Audio

Do not use extremely loud jump scares.

Keep volume reasonable.

Allow mute button.

## 18.3 Camera Privacy

Always show privacy note.

Do not access microphone.

Stop camera at end.

## 18.4 User Comfort

Add an emergency exit button in the corner:

> EXIT TEST

If clicked:

Show:

> Test terminated.

Then stop camera and return to start screen.

Optional creepy version should not block exit. The button must actually work.

---

# 19. Required Files and Implementation Notes

## 19.1 `index.html`

Should include:

* root div
* hidden video element
* main canvas
* UI containers
* start screen
* privacy modal
* denied screen
* end screen
* script entry

Suggested structure:

```html
<div id="app">
  <section id="start-screen"></section>
  <section id="privacy-modal"></section>
  <section id="denied-screen"></section>

  <section id="game-screen">
    <video id="camera-video" playsinline muted></video>
    <canvas id="mirror-canvas"></canvas>

    <div id="hud">
      <div id="live-label">LIVE</div>
      <div id="timer">00:00:00</div>
      <div id="phase-label">CALIBRATION</div>
      <div id="prompt"></div>
      <div id="diagnostics"></div>
      <div id="choices"></div>
    </div>

    <button id="exit-button">EXIT TEST</button>
  </section>

  <section id="end-screen"></section>
  <section id="debug-overlay"></section>
</div>
```

## 19.2 `main.ts`

Responsibilities:

* Instantiate managers.
* Wire button events.
* Start game.
* Start render loop.
* Handle cleanup.

## 19.3 `CameraSystem.ts`

Use `navigator.mediaDevices.getUserMedia`.

Important constraints:

```ts
{
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user"
  },
  audio: false
}
```

## 19.4 `FrameBuffer.ts`

Use an offscreen canvas to downscale frames before storing.

Pseudo-structure:

```ts
type BufferedFrame = {
  timeMs: number;
  imageData: ImageData;
};
```

Implement:

* `pushFrame`
* `getFrameAtDelay`
* `getNearestFrame`
* `trimOldFrames`

## 19.5 `EffectsRenderer.ts`

Main rendering steps:

1. Clear canvas.
2. Determine draw source.
3. Save context.
4. Apply mirror transform if needed.
5. Draw source.
6. Restore context.
7. Apply brightness/darkness.
8. Apply jitter/glitch.
9. Apply scanlines.
10. Apply vignette.
11. Apply dark center oval if needed.

## 19.6 `phases.ts`

Data-driven phase config.

This makes it easier for Codex/developer to tune.

## 19.7 `dialogue.ts`

Data-driven dialogue and choices.

## 19.8 `AudioManager.ts`

Must initialize only after user clicks.

Do not auto-play audio on page load.

## 19.9 `styles/main.css`

Should contain:

* CSS variables
* full-screen layout
* start/end screen styling
* canvas styling
* HUD styling
* glitch text classes
* modal styling
* responsive behavior

---

# 20. Minimum Playable Prototype Requirements

The first playable prototype must include:

1. Start screen
2. Privacy note
3. Camera permission flow
4. Live mirrored webcam display
5. Calibration prompts
6. Rolling frame buffer
7. Delayed reflection phase
8. Motion detection or timed stillness trigger
9. Mismatch event
10. Negative latency UI
11. Reflection dialogue with choices
12. Reflection exit sequence
13. Return sequence
14. End screen
15. Camera cleanup
16. Basic audio
17. Basic visual effects
18. Debug mode

If all 18 are implemented, the game is considered playable.

---

# 21. Stretch Goals

These are not required for the prototype.

## 21.1 Face Detection

Use browser-based face detection or MediaPipe to locate face position and darken eyes more accurately.

Not required.

## 21.2 Better Clip Selection

Analyze motion direction and use clips that better match prompts.

Example:

* If prompt says “turn left,” find a clip with horizontal motion.

Not required.

## 21.3 Second Playthrough Changes

Use localStorage to alter lines slightly on replay.

Example:

> Previous reflection detected.

Not required.

## 21.4 Downloadable “Test Report”

At the end, show a fake report:

```text
Subject ID: local
Reflection Offset: -03ms
Replacement Status: partial
```

Not required.

## 21.5 Itch.io Page Polish

Create cover image, description, content warning, and screenshots.

Not required for prototype.

---

# 22. Asset Plan

## 22.1 Required Assets

The prototype should be able to run with no external assets.

All of these can be generated procedurally:

* Scanlines
* Noise
* Static
* UI beeps
* Error tones
* Low hum
* Glitch blocks
* Vignette

## 22.2 Optional Audio Assets

If adding real audio files, use:

* low room tone
* CRT hum
* short static burst
* glass tap
* soft system beep
* distant chair creak
* low rumble

Recommended sources:

* self-recorded sounds
* royalty-free sound libraries
* Freesound with proper license
* Pixabay sound effects
* Sonniss GDC free bundles

## 22.3 Optional Texture Assets

* dust overlay
* fingerprint smudge
* CRT noise
* subtle glass reflection
* static texture

Can also be generated in canvas.

## 22.4 Font Assets

Prefer system fonts to avoid loading delay.

CSS fallback:

```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

---

# 23. Writing and Text Style Guide

## 23.1 Tone

The game’s text should feel like a cold technical system that slowly becomes personal.

Early text:

* neutral
* procedural
* clinical

Later text:

* accusatory
* impossible
* intimate
* ambiguous

## 23.2 Good Text Examples

Early:

> Please center yourself in the frame.

> Calibration complete.

> Minor latency detected.

Middle:

> Reflection drift detected.

> Do not correct it.

> Prediction error detected.

Late:

> You moved late.

> Why are you copying me?

> I was first.

Ending:

> Subject returned.

> Reflection released.

> You closed the wrong side.

## 23.3 Text Rules

* Keep lines short.
* Avoid paragraphs during gameplay.
* Avoid lore exposition.
* Avoid naming the entity.
* Avoid explaining the swap.
* Let the player infer.

---

# 24. Failure and Fallback Handling

## 24.1 Camera Denied

Show denied path.

Do not crash.

## 24.2 No Webcam Device

Show:

> No reflection device found.

Then:

> The test requires a camera.

Button:

> RETURN

## 24.3 Browser Unsupported

If `navigator.mediaDevices` or `getUserMedia` is unavailable:

Show:

> Browser does not support mirror access.

Recommend:

> Please use desktop Chrome or Edge.

## 24.4 Low Performance

If frame buffer causes slowdown:

* Lower buffer resolution.
* Lower capture FPS.
* Reduce glitch effects.
* Use timed events instead of motion-heavy processing.

## 24.5 Player Covers Camera

If motion score or brightness is too low for too long:

Show:

> Subject visibility low.

Later:

> Hiding delays replacement.

This can become diegetic, but should not block progress.

---

# 25. Development Roadmap

## Day 1: Core Mirror

Tasks:

* Create Vite project.
* Build start screen.
* Add privacy modal.
* Request webcam.
* Display mirrored webcam on canvas.
* Add basic HUD.
* Add timer.

Deliverable:

Player can grant camera access and see themselves in a clean mirror UI.

## Day 2: Frame Buffer and Delay

Tasks:

* Implement frame buffer.
* Capture downscaled frames.
* Retrieve delayed frames.
* Add delay phase.
* Add fake latency readout.
* Add phase manager.

Deliverable:

After calibration, the mirror begins lagging behind the player.

## Day 3: Motion and Mismatch

Tasks:

* Implement motion detector.
* Detect stillness.
* Trigger mismatch event.
* Add subtle glitch effects.
* Add scanlines/vignette.
* Add error beep.

Deliverable:

If player remains still, the reflection appears to move incorrectly.

## Day 4: Negative Latency and Dialogue

Tasks:

* Add negative latency phase.
* Add prediction event.
* Add dialogue system.
* Add choice buttons.
* Add creepy diagnostic states.

Deliverable:

Reflection accuses player of copying it.

## Day 5: Ending and Polish

Tasks:

* Implement reflection exit sequence.
* Implement fake empty frame.
* Return to live feed.
* Add final messages.
* Stop camera at end.
* Add audio polish.
* Add debug mode.
* Test full playthrough.

Deliverable:

Complete 7–9 minute playable browser horror prototype.

---

# 26. Definition of Done

The game is done when:

1. It runs in a desktop browser with `npm run dev`.
2. The start screen and privacy note are functional.
3. Webcam permission works.
4. Webcam feed is displayed as a mirrored canvas.
5. The player experiences a full timed sequence from calibration to ending.
6. The reflection becomes delayed.
7. The reflection produces at least one mismatch event.
8. The UI displays negative latency.
9. The reflection dialogue appears with choices.
10. The ending implies the reflection has left or swapped places.
11. Camera stream stops on end or exit.
12. No video is uploaded anywhere.
13. Debug mode can skip phases.
14. The prototype can be played from start to finish without developer intervention.

---

# 27. Codex Implementation Prompt

Use the following implementation prompt for Codex or another coding agent:

Build a complete playable browser prototype for a webcam horror game called “Latency: -03ms” using Vite, TypeScript, HTML, CSS, Canvas API, and browser webcam access through getUserMedia.

The game should be a 7–9 minute linear horror experience where the player grants webcam permission and sees a mirrored webcam feed. The game starts as a clean mirror calibration test, then the reflection becomes delayed using a rolling frame buffer, then mismatched using old frames and motion detection, then shows impossible negative latency, then displays reflection dialogue with choices, then ends with a fake reflection escape sequence and returns to live feed before cutting to black.

Implement the following systems as separate TypeScript modules:

* CameraSystem
* FrameBuffer
* MotionDetector
* PhaseManager
* EffectsRenderer
* DialogueManager
* AudioManager
* UIManager
* DebugManager
* StorageManager

Use a data-driven phase configuration file for all phase timings, prompts, diagnostics, delay values, and effect intensity.

The game must include:

* Start screen
* Privacy note modal
* Camera permission handling
* Camera denied fallback
* Main mirror canvas
* HUD with LIVE label, timer, phase label, prompts, and diagnostics
* Rolling frame buffer
* Delayed mirror phase
* Motion detection
* Mismatch event triggered by stillness or timer
* Negative latency phase
* Dialogue choices
* Reflection exit sequence
* Return to clean live feed
* End screen
* Camera cleanup
* Procedural audio
* Canvas visual effects
* Debug mode using ?debug=1

Do not use a backend. Do not upload video. Do not request microphone access. Stop the webcam stream at the end and when the player exits.

Make the game visually minimal, black-and-white, clinical, and unsettling. Use monospace fonts, subtle scanlines, glitch effects, vignette, fake diagnostic readouts, and short creepy text.

The project should run with:

npm install
npm run dev

And build with:

npm run build

Prioritize a working complete prototype over perfect visual polish.

---

# 28. Suggested First Implementation Order for Codex

Codex should implement in this order:

1. Scaffold Vite TypeScript project.
2. Build HTML/CSS layout.
3. Implement CameraSystem.
4. Implement UIManager.
5. Implement PhaseManager.
6. Implement live mirrored canvas rendering.
7. Implement FrameBuffer.
8. Implement delayed frame rendering.
9. Implement MotionDetector.
10. Implement EffectsRenderer.
11. Implement DialogueManager.
12. Implement AudioManager.
13. Implement phase data.
14. Implement mismatch event.
15. Implement negative latency phase.
16. Implement reflection dialogue choices.
17. Implement ending sequence.
18. Implement debug overlay.
19. Test and fix camera cleanup.
20. Polish UI and timing.

---

# 29. Final Creative Summary

The player should never feel like they are watching a ghost.

They should feel like they are watching evidence.

At the start, the mirror proves that it is live.

Then it proves that it is delayed.

Then it proves that it is wrong.

Then it proves that it is ahead.

Then it asks why the player is copying it.

The entire game is built on one simple fear:

> What if your reflection was not following you?
> What if you were following it?
