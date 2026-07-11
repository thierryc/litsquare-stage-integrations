# LitSquare Stage Templates

These templates are starter projects for code-first LitSquare Stage video work. Each one is small, deterministic, and app-renderable.

Template dependency paths point at the local runtime in this workspace. When copying a template outside this workspace, replace the `@litsquare/stage` file dependency with the published package or the correct local path.

## Gallery

| Template | Best for | Technique | Output | Customize first |
| --- | --- | --- | --- | --- |
| [Basic Slideshow](basic-slideshow/README.md) | Launch posts, cards, sponsor loops, social drafts | DOM layout and frame-derived content timing | 1920x1080 MP4 | Replace the `slides` array |
| [Three Product Orbit](three-product-orbit/README.md) | Product hero spins, cinema idents, spatial UI explainers | Three.js camera/object motion | 4K MP4 with motion blur | Swap the placeholder cube |
| [Responsive Format Pack](responsive-format-pack/README.md) | Multi-format campaigns and cutdowns | Aspect-aware layout from `FrameContext` | 4K source, adaptable formats | Change render dimensions and inspect stills |
| [Weather Channel Batch](weather-channel-batch/README.md) | Weather, sports, finance, real-estate, local ads | Local data snapshot and variant naming | 1920x1080 MP4 | Change `data/weather-snapshot.json` |
| [Figma Frame Animation](figma-frame-animation/README.md) | Design handoff and branded UI motion | Layer data, tokens, and frame-derived transitions | 4K MP4 with motion blur | Replace the `layers` array |
| [Variable Font Title](variable-font-title/README.md) | Kinetic type, title cards, brand posts | Variable font axes from `FrameContext` | 4K 60 fps MP4 | Add a licensed local variable font |
| [Paper SVG Morph](paper-svg-morph/README.md) | Logo morphs, map shapes, icon transitions | Paper.js point interpolation and SVG output | 1920x1080 MP4 | Normalize and replace source paths |
| [WebGPU Shader Loop](webgpu-shader-loop/README.md) | Shader backgrounds and GPU experiments | WebGPU with Canvas 2D fallback | 1920x1080 MP4 | Replace shader uniforms and fallback drawing |

Preview assets: TODO. Add rendered stills or short MP4 clips for each template as the visual gallery matures.

## Standard Commands

From any template directory:

```bash
pnpm install
pnpm dev
pnpm build
```

With the LitSquare Stage macOS app running, render a still:

```bash
node ../../scripts/render-stage-project.mjs \
  --project "$PWD" \
  --kind frame \
  --output /tmp/template-frame.png \
  --frame 90 \
  --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs \
  --project "$PWD" \
  --kind video \
  --output /tmp/template-render.mp4 \
  --start-frame 0 \
  --end-frame 179 \
  --overwrite
```

Adjust `--end-frame` to match each template's `preview.durationFrames`.
