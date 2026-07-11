# LitSquare Stage Runner Surfaces

Pick one primary surface per scene unless the brief explicitly requires mixed media.

## CSS / DOM

- Build semantic DOM once in `setup`.
- Update CSS variables, text, classes, and attributes from `renderFrame`.
- Use `document.fonts.ready` in `prepareExport` when local or web fonts affect layout.
- Avoid export-critical CSS transitions and keyframes; use them only for preview experiments.

## JavaScript DOM

- Keep DOM nodes stable and mutate text, attributes, transforms, opacity, and styles from frame progress.
- Batch DOM lookups in `setup` when practical.
- Avoid timers, wall-clock deltas, and requestAnimationFrame-only state for rendered output.

## SVG

- Use SVG for vector shapes, masks, strokes, charts, icons, and morph-ready paths.
- Update attributes such as `d`, `points`, `stroke-dashoffset`, `transform`, opacity, and gradient stops from `FrameContext`.
- Normalize path or point counts before interpolation.

## Canvas 2D

- Size the canvas from `ctx.width` and `ctx.height`.
- Redraw the entire frame in `renderFrame`.
- Keep drawing state deterministic and reset transforms between layers.
- Decode image assets before export.

## WebGL / Three.js

- Initialize renderers, scenes, geometry, materials, textures, lights, and cameras in `setup`.
- Set renderer size and pixel ratio deliberately from `ctx`.
- Derive camera, object transforms, lights, uniforms, and shader time from `ctx.frame` or `ctx.time`.
- Finish rendering synchronously before returning from `renderFrame`.
- Dispose renderers, buffers, textures, geometries, and materials in `teardown`.

## WebGPU

- Detect `navigator.gpu` and provide a visible Canvas or WebGL fallback.
- Request adapter/device and create pipelines outside `renderFrame`.
- Configure canvas format and write uniform buffers from `FrameContext`.
- Do not perform async shader, texture, or pipeline loading inside `renderFrame`.
- Draw a ready frame in `prepareExport`.

## Paper.js / Path Morphs

- Use Paper.js only when path tools are needed.
- Bind Paper.js to a canvas sized from `ctx`.
- Keep tool/mouse state out of render paths.
- Capture source, midpoint, densest overlap, and final frames for QA.
