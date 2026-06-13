# QA Checklist

Use this checklist before release. Test on a desktop webcam whenever possible.

## Full Playthrough

- [ ] Start screen loads with title, content warning, privacy footer, fullscreen recommendation, and buttons.
- [ ] Privacy modal opens and closes cleanly.
- [ ] BEGIN TEST requests fullscreen from the click gesture when allowed and fails silently when denied.
- [ ] BEGIN TEST requests camera permission and does not request microphone permission.
- [ ] Calibration prompts are readable and paced clearly.
- [ ] Delayed reflection phase still says LIVE while the frame delay increases.
- [ ] Mismatch phase triggers a subtle mismatch after stillness.
- [ ] Negative latency phase shows the opposite-hand prediction and returns to live feed smoothly.
- [ ] Reflection dialogue appears, choices are readable, and exactly one choice can be selected.
- [ ] Selected dialogue response displays, then the remaining dialogue continues.
- [ ] Reflection exit transfer cycles old frames/clips and escalates without becoming unreadable.
- [ ] Return phase shows live camera again and remains quiet/unsettling.
- [ ] Final TEST COMPLETE screen appears.
- [ ] CLOSE MIRROR stops the camera, attempts to close the tab, shows fallback text if blocked, then reaches END.

## Debug Playthrough

- [ ] `?debug=1` shows the debug overlay.
- [ ] Normal URLs do not show debug info.
- [ ] Debug mode uses shortened phase/dialogue timing.
- [ ] Debug overlay shows current phase, active event, render source, buffer count, motion score, stillness, prediction source, dialogue state, and cleanup sequence state.

## Camera Permission

- [ ] Accepting permission starts the mirror.
- [ ] Denying permission shows the denied fallback and TRY AGAIN.
- [ ] No camera device shows a clean no-device fallback.
- [ ] Unsupported browser path shows the browser support fallback.

## Cleanup

- [ ] EXIT TEST stops the camera tracks and returns to the start screen.
- [ ] Final TEST COMPLETE stops the camera tracks.
- [ ] CLOSE MIRROR keeps the camera stopped.
- [ ] Reloading, closing, or navigating away stops camera tracks through page unload handlers.

## Browser Coverage

- [ ] Chrome desktop playthrough.
- [ ] Edge desktop playthrough.
- [ ] macOS webcam permission/playthrough check.
- [ ] Windows webcam permission/playthrough check.

## Build

- [ ] `npm install` completes on a clean machine.
- [ ] `npm run build` completes.
- [ ] `npm run preview` serves the built game.
- [ ] Built `dist/` works over `https://` or `localhost`.
