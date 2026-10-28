---
name: litsquare-stage-author-motion
description: Author or revise LitSquare Stage scenes and frame-derived motion after a project exists. Use for CSS variable animation, JavaScript DOM animation, SVG/path motion, Canvas 2D, WebGL, Three.js, WebGPU, Paper.js-style morphs, timing helpers, easing, loops, seeded randomness, and motion-blur-safe animation code.
---

# LitSquare Stage Author Motion

Use after `litsquare-stage-init-project` has created or verified the project contract.

When app access is needed, prefer the host's MCP tools. If they are unavailable, use the shipped scripts, which share one standards-based MCP client; never construct a raw `{tool,payload}` request.

## Required Workflow

1. Inspect existing scene code and `stage.config.json`.
2. Read `references/motion-system.md`.
3. Read only the relevant section of `references/runner-surfaces.md` for the chosen surface.
4. When the task includes audio or audiovisual synchronization, read `references/audio-sync.md`.
5. Choose one primary surface per scene unless the user explicitly wants mixed media.
6. Compute visible state from `ctx.frame`, `ctx.time`, `ctx.fps`, `ctx.durationFrames`, `ctx.width`, and `ctx.height`.
7. Use `prepareExport` for fonts, images, data snapshots, audio readiness, and GPU resources.
8. Preserve fractional-frame correctness for motion blur and audio endpoints.
9. Build and run `validate-stage-project.mjs` when feasible.

## Avoid

- `Date.now()`, `performance.now()`, and unseeded `Math.random()` in export-critical code.
- CSS transitions or keyframes as the final source of motion when a render must be deterministic.
- Async shader, texture, font, image, or data loading inside `renderFrame`.
- Hard-coded 1920x1080 layout when output may be responsive.

## Handoff

Report the primary surface, timing model, edited scene files, readiness waits, validation result, and whether the animation is ready for `litsquare-stage-render-video` or needs `litsquare-stage-responsive-pack`.
