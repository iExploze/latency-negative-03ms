# Latency: -03ms

Latency: -03ms is a short browser webcam horror game built with Vite, TypeScript, HTML, CSS, and Canvas. The player grants camera access and watches a clinical mirror calibration test become delayed, predictive, accusatory, and wrong.

## Content Warning

Contains webcam-based psychological horror, mild visual distortion, scanlines, glitch effects, unsettling text, and brief close-tab/fake system behavior. There are no loud jumpscares.

## Privacy

This experience uses your webcam locally in the browser.

- No video is uploaded.
- No microphone access is requested.
- Webcam frames are kept in browser memory for local visual effects.
- Camera tracks are stopped when the player exits, finishes the game, closes the mirror, or leaves the page.
- There is no backend.

## Browser Recommendation

Use a desktop browser with a webcam. Chrome or Edge is recommended. Play in fullscreen with headphones for best effect.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Debug Mode

Add `?debug=1` to the local URL for faster phase timing and an on-screen debug overlay:

```text
http://localhost:5173/?debug=1
```

Debug mode shows the current phase, active event, render source, buffer frame count, motion state, dialogue state, and key tuning values.

## Deployment Notes

This is a static Vite app. Build output is written to `dist/`.

- Vercel: use `npm run build`, output directory `dist`.
- Netlify: use `npm run build`, publish directory `dist`.
- itch.io: upload the built `dist` contents as an HTML game. Enable fullscreen if desired.

The site must be served from `https://` or `localhost` for webcam access to work in modern browsers.
