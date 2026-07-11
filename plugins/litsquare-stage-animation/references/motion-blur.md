# Motion Blur

LitSquare Stage supports render-time motion blur through `render.motionBlur`.

```json
{
  "render": {
    "motionBlur": {
      "enabled": true,
      "shutterAngle": 180,
      "sampleCount": 8
    }
  }
}
```

## Defaults

- Draft: disabled, or `sampleCount: 4` with `shutterAngle: 180`.
- Final: `sampleCount: 8` with `shutterAngle: 180`.
- Maximum: `sampleCount: 16`; use for hero shots, fast camera moves, or 4K/8K final exports only.

## Authoring Requirements

Render code must be deterministic for fractional frames. The app samples around the source frame when blur is enabled, so `renderFrame` logic must accept non-integer `ctx.frame`.

Do not use random values, CSS transitions, or wall-clock time for export-critical motion. Use seeded randomness and frame-derived progress.
