# WebGPU Shader Loop

## Purpose

Use this template for shader effects, generative backgrounds, music visuals, and GPU experiments that still need deterministic video export.

## Best Use Cases

- A procedural background loop.
- A branded visualizer texture.
- A GPU experiment with a reliable Canvas 2D fallback.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/webgpu-shader-loop-frame.png --frame 60 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/webgpu-shader-loop.mp4 --start-frame 0 --end-frame 119 --overwrite
```

## Main Edit Points

- Replace shader code and uniforms in `src/main.ts`.
- Keep all GPU resources stable after setup.
- Update the Canvas 2D fallback so renders remain understandable if WebGPU is unavailable.

## Data And Assets

No required data file. Add local textures or LUTs under `assets/` and preload them before export.

## Output

Default preview is 1280x720 at 30 fps. Default render output is 1920x1080 H.264 MP4 with motion blur disabled.

## What This Example Teaches

- WebGPU setup with deterministic frame uniforms.
- Render-safe fallback behavior.
- Avoiding async GPU work inside `renderFrame`.

## Customization Prompts

- Replace the shader with a branded gradient field.
- Add local texture input and animate UVs from `FrameContext`.
- Tune the Canvas fallback to match the shader composition.
