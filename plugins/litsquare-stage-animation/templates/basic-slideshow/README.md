# Basic Slideshow

## Purpose

Use this template for simple text, image, and video-card sequences: launch posts, property cards, event sponsor loops, social story drafts, and quick content explainers.

## Best Use Cases

- A short sequence with two to five slides.
- A fast campaign draft that needs clean text and image timing.
- A safe first project for learning the runner lifecycle.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/basic-slideshow-frame.png --frame 90 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/basic-slideshow.mp4 --start-frame 0 --end-frame 179 --overwrite
```

## Main Edit Points

- Replace the `slides` array in `src/main.ts`.
- Update colors, type, and spacing in `src/styles.css`.
- Add local media under `assets/` and reference it from slide data.

## Data And Assets

No required data file. Add local images, video, or fonts only when your slides need them.

## Output

Default output is a 1920x1080 H.264 MP4 at 30 fps. Motion blur is disabled for fast draft renders.

## What This Example Teaches

- Full-frame DOM layout.
- Frame-derived progress and slide timing.
- Safe separation between content data and render logic.

## Customization Prompts

- Replace the slide array with five product launch beats.
- Turn this into a real-estate listing card sequence.
- Add a sponsor logo loop with one slide per sponsor.
