# Motion System

LitSquare Stage motion must be deterministic and frame-derived.

## Core Rules

- Compute visible state from `ctx.frame`, `ctx.time`, `ctx.fps`, and `ctx.durationFrames`.
- Support fractional frames for motion blur.
- Express beats in seconds, then convert to frames.
- Use seeded randomness for generative motion.
- Make loops seamless when `preview.loop` is true.

## Helpers

```ts
export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function invLerp(start: number, end: number, value: number) {
  return clamp01((value - start) / Math.max(end - start, 0.0001));
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const x = invLerp(edge0, edge1, value);
  return x * x * (3 - 2 * x);
}

export function easeInOutCubic(value: number) {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function timelineSegment(ctx: FrameContext, startSeconds: number, endSeconds: number) {
  return invLerp(startSeconds * ctx.fps, endSeconds * ctx.fps, ctx.frame);
}

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function loopProgress(ctx: FrameContext) {
  return ((ctx.frame % ctx.durationFrames) + ctx.durationFrames) % ctx.durationFrames / ctx.durationFrames;
}
```

## Avoid

- `Date.now()`, `performance.now()`, and unseeded `Math.random()`.
- CSS transitions based on page-load timing.
- Mutation outside `renderFrame` that changes rendered state over time.
- Data fetching or asset loading during frame rendering.
