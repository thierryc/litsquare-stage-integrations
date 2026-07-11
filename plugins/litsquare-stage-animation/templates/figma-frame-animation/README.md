# Figma Frame Animation

## Purpose

Use this template after converting a design frame into local tokens, text, colors, SVG paths, and assets. It turns a static design handoff into frame-derived motion.

## Best Use Cases

- Branded product UI reveals.
- Design-system motion studies.
- Marketing visuals based on approved static frames.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/figma-frame-animation-frame.png --frame 90 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/figma-frame-animation.mp4 --start-frame 0 --end-frame 179 --overwrite
```

## Main Edit Points

- Replace the `layers` array in `src/main.ts` with local frame-derived layer data.
- Copy exported images, SVGs, and fonts into `assets/`.
- Update `src/styles.css` with the local design tokens.

## Data And Assets

Do not render live from a design tool. Export the frame into local assets and structured layer data before rendering.

## Output

Default render output is 3840x2160 H.264 MP4 at 30 fps with 4-sample motion blur.

## What This Example Teaches

- Translating design layers into deterministic motion.
- Keeping tokens and assets local.
- Animating layout from stable frame data instead of live design APIs.

## Customization Prompts

- Replace the layer list with a product dashboard frame.
- Animate each text layer from its design position into final layout.
- Add a logo reveal using exported SVG paths.
