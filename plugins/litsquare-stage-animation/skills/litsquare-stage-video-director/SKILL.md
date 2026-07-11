---
name: litsquare-stage-video-director
description: Router-only workflow for LitSquare Stage video work. Use when the user asks to create, initialize, animate, polish, adapt, render, review, convert Figma input, or batch-generate a LitSquare Stage video. Classifies the request and loads the smallest focused LitSquare Stage skill chain.
---

# LitSquare Stage Video Director

Route LitSquare Stage Animation requests. Do not implement focused workflow details here.

## Route By Goal

- New project, starter, setup, template, or "make a LitSquare Stage video": `litsquare-stage-init-project`.
- Add or revise motion, scenes, HTML/CSS/SVG/Canvas/WebGL/Three.js/WebGPU behavior: `litsquare-stage-author-motion`.
- Multi-format, responsive, social, cinema, 4K, 8K, or LED output: `litsquare-stage-responsive-pack`.
- Still capture, PNG sequence, MP4/MOV, queue, diagnostics, render progress, or app export: `litsquare-stage-render-video`.
- Final visual or technical acceptance: `litsquare-stage-quality-review`.
- Figma frame, screenshot, design file, or design-system source: `litsquare-stage-figma-source`.
- CSV, JSON, API snapshots, weather, finance, sports, real-estate, or batch variants: `litsquare-stage-data-video`.

## Default Chain

For a broad create-to-render request, use:

1. `litsquare-stage-init-project`
2. `litsquare-stage-author-motion`
3. `litsquare-stage-responsive-pack` when more than one format is needed
4. `litsquare-stage-render-video`
5. `litsquare-stage-quality-review`

## Hard Rules

- New projects must go through `litsquare-stage-init-project` before authoring or rendering.
- Rendering must go through `litsquare-stage-render-video`; do not use Playwright, Chromium, browser automation, or remote services as render fallbacks in this plugin version.
- For immediate render requests on an unverified project, run `litsquare-stage-render-video`; it owns app preflight and failure behavior.

## Output

State the selected skill chain, the reason for the first focused skill, and any known deliverables such as project path, formats, duration, fps, and artifact type.
