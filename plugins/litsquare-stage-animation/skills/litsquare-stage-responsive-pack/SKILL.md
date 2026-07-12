---
name: litsquare-stage-responsive-pack
description: Adapt a LitSquare Stage animation across multiple output formats and proportional HTML layouts. Use for responsive video packs, social aspect ratios, square, portrait, landscape, 4K, 8K, cinema, LED walls, safe areas, fluid typography, and multi-format frame checks.
---

# LitSquare Stage Responsive Pack

Use when one animation must render cleanly across more than one size or aspect ratio.

## Required Workflow

1. Read `references/format-matrix.md` and `references/responsive-fluid-html.md`.
2. Define the requested format pack and safe-area constraints.
3. Use normalized layout decisions derived from `ctx.width`, `ctx.height`, and aspect ratio.
4. Choose a strategy per scene: reflow, crop, letterbox, pillarbox, or alternate layout.
5. Drive CSS variables from `renderFrame`; do not rely on viewport-only CSS for render-critical placement.
6. Capture representative stills for each format before full renders.
7. Render every final video format as its own `litsquare_stage_start_video_render` job through the LitSquare Stage app.
8. Never create social variants by passing a PNG sequence or master video to FFmpeg or another external encoder. Put each target’s dimensions, fps, motion blur, codec/container, and output path in the native render request.

## Default Pack

Use this pack unless the user asks otherwise:

- 1080x1080
- 1080x1350
- 1080x1920
- 1920x1080
- 3840x2160
- 4096x2160
- 7680x4320

## Handoff

Report each target format, responsive strategy, safe-area assumptions, still-frame checks, and whether the pack is ready for `litsquare-stage-render-video`.
