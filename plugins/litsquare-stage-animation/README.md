# LitSquare Stage Animation Plugin

`litsquare-stage-animation` bundles shared Codex and Claude Code skills for planning, building, polishing, and rendering LitSquare Stage animation projects.

## Skills

- `litsquare-stage-video-director`: router for start-to-finish LitSquare Stage video work.
- `litsquare-stage-init-project`: initialize a runnable project with the standard stage, runner, config, and render-safe defaults.
- `litsquare-stage-author-motion`: author frame-derived motion across CSS, JS DOM, SVG, Canvas, WebGL, Three.js, WebGPU, and path morphing.
- `litsquare-stage-responsive-pack`: adapt one animation across social, HD, cinema, 4K, 8K, and custom formats.
- `litsquare-stage-render-video`: mandatory app preflight, still capture, sequence/video render, progress, diagnostics, and artifact QA.
- `litsquare-stage-quality-review`: final visual and technical acceptance review.
- `litsquare-stage-figma-source`: convert Figma or visual design input into local renderable LitSquare Stage code.
- `litsquare-stage-data-video`: generate deterministic videos from API, CSV, JSON, and batch data snapshots.

## App Integration

The plugin includes one shared `.mcp.json` for the local LitSquare Stage macOS app endpoint. Its explicit HTTP transport type is accepted by both Codex and Claude Code. Keep it as an HTTP MCP connection, not a stdio proxy:

```json
{
  "type": "http",
  "url": "http://127.0.0.1:7460/mcp"
}
```

Use the canonical MCP progress tool as the primary readiness check. Use `scripts/check-stage-app.mjs` only in clients where the plugin MCP tools are unavailable and localhost access is permitted. Use `scripts/init-stage-project.mjs` to copy and normalize templates, `scripts/validate-stage-project.mjs` to check the minimum project contract, `scripts/render-stage-project.mjs` only for CLI fallback renders, and `scripts/get-render-progress-state.mjs` to adapt app job state into the progress-widget state model.

The plugin also includes a render-progress UI template for the app-served MCP widget:

```text
apps/render-progress/
assets/render-progress-widget.html
```

The source template accepts render job state by embedded JSON, query state, `postMessage`, or direct calls to `window["litsquare-stage-render-progress"].render(state)`. Rebuild the single-file widget asset after edits:

```bash
node scripts/build-render-progress-widget.mjs
```

Preview the bundled widget locally with sample state:

```bash
node scripts/make-render-progress-preview-url.mjs
```

Open the returned `url` in a browser. For live app state, first write a widget-compatible JSON snapshot:

```bash
node scripts/get-render-progress-state.mjs --project /absolute/project > /tmp/stage-progress.json
node scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json
```

The HTML asset does not render inside a conversation by itself. Both clients use the LitSquare Stage app JSON-RPC MCP tools: `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress`. Codex can additionally mount `ui://widget/litsquare-stage-render-progress.html` through its widget metadata; Claude Code consumes the same structured tool results without depending on that widget host.

Final MP4/MOV deliverables must come directly from `litsquare_stage_start_video_render`. The app owns H.264 encoding, container creation, audio muxing, metadata, and per-format output; PNG sequences and FFmpeg are not a video fallback.

## Smoke Test

From the repository root, with the LitSquare Stage macOS app running on `http://127.0.0.1:7460`, render the local anotherplanet smoke stage:

```bash
node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs
```

The script builds `stages/anotherplanet-cube-litsquare-stage`, captures a still, and renders a short MP4 through the app. It does not use Chromium, Playwright, or a remote fallback.

For a local debug app bundle, pass:

```bash
node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs --app-path /private/tmp/LitSquare Stage Debug.app
```

## Templates

- `basic-slideshow`
- `responsive-format-pack`
- `variable-font-title`
- `paper-svg-morph`
- `three-product-orbit`
- `webgpu-shader-loop`
- `figma-frame-animation`
- `weather-channel-batch`

## Prompt Assets

Prompt files under `prompts/` are reference assets for common workflows. Skills remain the shared reusable behavior for both supported clients.
