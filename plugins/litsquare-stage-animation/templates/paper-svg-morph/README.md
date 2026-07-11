# Paper SVG Morph

## Purpose

Use this template for logo morphs, icon transitions, map region animation, abstract vector loops, and Paper.js-style path workflows.

## Best Use Cases

- A logo transforming into a symbol or product mark.
- A map region, route, or shape reveal.
- Abstract vector motion where SVG output is easier to inspect than canvas pixels.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/paper-svg-morph-frame.png --frame 90 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/paper-svg-morph.mp4 --start-frame 0 --end-frame 179 --overwrite
```

## Main Edit Points

- Replace source and target point data in `src/main.ts`.
- Tune interpolation and easing from `FrameContext`.
- Update colors, stroke, fills, and background in `src/styles.css`.

## Data And Assets

Production path morphs should normalize source and target paths before interpolation so both shapes have compatible point counts.

## Output

Default output is a 1920x1080 H.264 MP4 at 30 fps with 4-sample motion blur.

## What This Example Teaches

- Deterministic point interpolation.
- Generating SVG from frame-derived vector state.
- Keeping vector morphs inspectable and render-safe.

## Customization Prompts

- Morph a logo into a product icon.
- Replace the points with two normalized map outlines.
- Add a secondary path trail behind the main shape.
