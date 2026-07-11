# Three Product Orbit

## Purpose

Use this template for product hero spins, cinema idents, spatial UI explainers, premium social renders, and procedural 3D motion.

## Best Use Cases

- A product rotating under controlled light.
- A branded 3D intro or outro.
- A spatial feature reveal with callout text.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/three-product-orbit-frame.png --frame 90 --overwrite
```

Render final video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/three-product-orbit.mp4 --start-frame 0 --end-frame 179 --overwrite
```

## Main Edit Points

- Replace the placeholder cube in `src/main.ts`.
- Add GLTF/GLB assets or textures under `assets/`.
- Tune camera, light, object rotation, and text callouts from `FrameContext`.

## Data And Assets

Use local models, textures, HDR-like backplates, and product images. Load all render-critical resources before export.

## Output

Default render output is 3840x2160 H.264 MP4 at 30 fps with 8-sample motion blur.

## What This Example Teaches

- Deterministic Three.js scene updates.
- Camera and object motion from frame-derived state.
- Premium render settings and motion blur workflow.

## Customization Prompts

- Swap the cube for a GLB product model.
- Add three feature callouts timed to the orbit.
- Render a still first, then tune motion blur for the final pass.
