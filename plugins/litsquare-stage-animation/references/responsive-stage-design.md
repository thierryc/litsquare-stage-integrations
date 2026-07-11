# Responsive Stage Design

## Core Rule

Design in normalized composition space, then derive pixels from the current `FrameContext`:

- `ctx.width`
- `ctx.height`
- `ctx.durationFrames`
- `ctx.fps`
- `ctx.frame`
- `ctx.time`

Avoid hard-coded 1920x1080 placement unless the brief is truly single-format.

## Layout Tokens

Derive:

- `--stage-width`
- `--stage-height`
- `--stage-aspect`
- `--safe-x`
- `--safe-y`
- `--fluid-unit`
- `--title-size`

Use safe areas for titles, captions, logos, and data labels. For social formats, reserve extra bottom space for platform UI.

## Aspect Strategies

- Reflow: best for data graphics, typography, and UI-like compositions.
- Crop: best for image or product scenes with a central subject.
- Letterbox/pillarbox: best when preserving exact cinematic framing matters.
- Alternate layout: best for radically different ratios such as 16:9 and 9:16.

## QA

Capture representative frames in every target format: first frame, first motion beat, densest content frame, final frame. Check text fit, overlap, subject visibility, and safe area compliance.
