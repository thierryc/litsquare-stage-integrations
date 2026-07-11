---
name: litsquare-stage-init-project
description: Initialize or repair a runnable LitSquare Stage animation project. Use for new LitSquare Stage videos, starters, templates, project setup, responsive HTML stage setup, runner wiring, Vite package setup, stage.config.json, attachBrowserHost, attachRenderHost, and motion-blur-safe defaults.
---

# LitSquare Stage Init Project

This is the most important skill for new LitSquare Stage video work. It produces the minimum renderable project contract before any long render is attempted.

## Inputs

Infer sensible defaults when the user does not specify them:

- Template or surface: basic DOM/CSS, responsive format pack, variable font title, Paper/SVG morph, Three.js/WebGL, WebGPU with fallback, Figma frame, or data video.
- Duration, fps, resolution, format pack, loop behavior, and final artifact type.
- Visual subject, assets, typography, data source, and whether motion blur is draft or final.

Defaults: 1920x1080, 30 fps, 180 frames, draft motion blur disabled, final motion blur `sampleCount: 8` and `shutterAngle: 180`.

## Required Workflow

1. Inspect the target repo or destination folder before writing.
2. Read `references/stage-contract.md`.
3. For proportional HTML or multi-format work, read `references/responsive-fluid-html.md`.
4. Choose the closest template under `templates/` and initialize with:

   ```bash
   node plugins/litsquare-stage-animation/scripts/init-stage-project.mjs --template <template> --target <absolute-target> --name <project-name>
   ```

5. Ensure the project has `stage.config.json`, Vite package scripts, `index.html`, `src/main.ts`, `src/styles.css`, local `assets/` and `data/` folders, a full-frame `#stage`, `createRunner`, `attachBrowserHost`, and `attachRenderHost`.
6. Verify render-critical state is derived from `FrameContext`, not wall-clock time, unseeded randomness, CSS load timing, or requestAnimationFrame-only state.
7. Run the project build when feasible, then run:

   ```bash
   node plugins/litsquare-stage-animation/scripts/validate-stage-project.mjs --project <absolute-target>
   ```

## Surface Selection

Use exactly one primary surface per scene unless the user explicitly asks for mixed media. When selecting or changing a surface, read `references/runner-surfaces.md`.

## Handoff

End with the project path, selected template/surface, config defaults, build and validation result, and the next skill to use.
