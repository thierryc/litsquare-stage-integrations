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

The render-progress UI is owned and served by the LitSquare Stage macOS app at `ui://widget/litsquare-stage-render-progress-v2.html`; the plugin does not ship a duplicate HTML implementation. Both clients use the canonical JSON-RPC MCP tools: `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress`. Codex can mount the compact app-served resource through standard `_meta.ui.resourceUri` and the `openai/outputTemplate` compatibility alias; Claude Code consumes the same structured state without depending on the widget host.

Preview the canonical resource and current app state locally:

```bash
node scripts/make-render-progress-preview-url.mjs
```

For a specific job or saved state, pass `--job-id JOB_ID` or `--state /tmp/stage-progress.json`.

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
