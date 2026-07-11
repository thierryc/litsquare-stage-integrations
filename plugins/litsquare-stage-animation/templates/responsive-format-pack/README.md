# Responsive Format Pack

## Purpose

Use this template when one animation must render as square, portrait, vertical, 16:9, 4K, DCI-style, or custom display formats.

## Best Use Cases

- Social campaigns with multiple aspect ratios.
- Event signage and LED wall variants.
- Product or brand motion that must survive format changes.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/responsive-format-pack-frame.png --frame 90 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/responsive-format-pack.mp4 --start-frame 0 --end-frame 179 --overwrite
```

## Main Edit Points

- Change `render.width` and `render.height` in `stage.config.json`.
- Update layout rules in `src/main.ts` that derive position from `ctx.width`, `ctx.height`, and aspect ratio.
- Capture stills for every target format before final video export.

## Data And Assets

No required data file. Keep source assets large enough for the largest target format, but avoid oversized images that slow preview and render.

## Output

Default render output is 3840x2160 H.264 MP4 at 30 fps with 4-sample motion blur.

## What This Example Teaches

- Responsive stage layout without web-page chrome.
- Format-aware safe areas and scaling.
- Reusing one motion system across multiple deliverables.

## Customization Prompts

- Add a vertical 1080x1920 render target.
- Rebuild the layout for square feed posts.
- Create a 4K master and derive social cutdowns from it.
