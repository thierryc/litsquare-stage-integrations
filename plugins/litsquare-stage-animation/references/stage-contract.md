# LitSquare Stage Stage Contract

Every initialized LitSquare Stage video project must satisfy this minimum contract before rendering.

## Files

- `package.json` with `build` and `dev` scripts.
- `stage.config.json` with `preview` and `render` blocks.
- `index.html` with a single full-frame `#stage` root.
- `src/main.ts` or equivalent entry that creates a LitSquare Stage runner.
- `src/styles.css` or equivalent stage styling.
- `assets/` for local media, fonts, and images.
- `data/` for local snapshots and variant inputs.

## Runner Lifecycle

Use the standard host pattern:

```ts
const runner = createRunner({
  root,
  sketch,
  initialContext: {
    fps: config.preview.fps,
    width: config.preview.width,
    height: config.preview.height,
    durationFrames: config.preview.durationFrames
  }
});

attachBrowserHost(runner, {
  fps: config.preview.fps,
  width: config.preview.width,
  height: config.preview.height,
  durationFrames: config.preview.durationFrames,
  autoplay: true,
  loop: config.preview.loop
});

attachRenderHost(runner);
```

`setup` creates DOM, canvases, SVG roots, renderer objects, and stable resources. `prepareExport` waits for fonts, images, data snapshots, audio, and GPU readiness. `renderFrame` derives visible state from `FrameContext`. `teardown` disposes GPU renderers, textures, audio graphs, timers, and temporary resources.

## Export Readiness

- All visible motion derives from `ctx.frame`, `ctx.time`, `ctx.fps`, and `ctx.durationFrames`.
- Layout derives from `ctx.width`, `ctx.height`, and aspect ratio.
- Render-critical randomness is seeded.
- Local assets are loaded before export.
- No live API request happens inside `renderFrame`.
- No browser load-time transition is the final source of rendered motion.

## Config Defaults

General draft defaults:

```json
{
  "preview": {
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "durationFrames": 180,
    "loop": true
  },
  "render": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "motionBlur": {
      "enabled": false,
      "shutterAngle": 180,
      "sampleCount": 1
    }
  }
}
```

Final motion blur defaults are `enabled: true`, `sampleCount: 8`, and `shutterAngle: 180`.
