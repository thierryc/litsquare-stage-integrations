# Animation Best Practices

## Determinism

- Compute all visible state from `ctx.frame`, `ctx.time`, `ctx.fps`, and `ctx.durationFrames`.
- Support fractional frames for motion blur.
- Use seeded randomness.
- Keep assets local and versioned with the project.

## Readiness

Use `prepareExport` to wait for:

- Fonts: `document.fonts.ready`
- Images: decode or load promises
- WebGL/WebGPU setup
- External data snapshots
- Audio offline render readiness

## Motion

- Use named beats: intro, reveal, hold, transition, outro.
- Express timing in seconds, then convert to frames.
- Prefer reusable easing helpers and timeline functions.
- Use loop-safe math when `preview.loop` is true.

## Rendering

- Use `attachRenderHost` for app export.
- Use `attachBrowserHost` only for preview.
- Use app diagnostics before making speculative fixes.
- Run low-res stills before expensive 4K/8K or blurred video renders.
