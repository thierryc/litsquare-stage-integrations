# Render Progress UI

The compact render-progress widget is owned and served by the LitSquare Stage macOS app. The integration plugin supplies the MCP connection, preflight checks, skills, and local preview helper; it does not ship a duplicate widget implementation.

## Canonical Resource

- MCP resource: `ui://widget/litsquare-stage-render-progress-v2.html`
- MIME type: `text/html+skybridge`
- App source: `Sources/LitSquareStageRenderKit/Resources/RenderProgressWidget.html` in the macOS repository
- State adapter: `scripts/get-render-progress-state.mjs`
- Local preview helper: `scripts/make-render-progress-preview-url.mjs`

The widget is a dependency-free inline card with one compact header, a progress row, one metadata line, a constrained latest-frame preview, and collapsed details. Artifacts, recent events, and diagnostics are capped so the card never creates nested scrolling.

## Local Preview

Start the LitSquare Stage app, then fetch its canonical resource and current progress state:

```bash
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
```

Use a specific job or a saved state snapshot when needed:

```bash
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --job-id JOB_ID
node plugins/litsquare-stage-animation/scripts/get-render-progress-state.mjs --project /absolute/project > /tmp/stage-progress.json
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json
```

The helper writes the app-served HTML to a temporary file and prints a file URL with state attached. It fails when the companion app is unavailable or still exposes the v1 widget contract.

## Conversation Contract

The LitSquare Stage JSON-RPC MCP bridge must:

1. Expose `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress`.
2. Return progress state as `structuredContent`.
3. Attach `_meta.ui.resourceUri` with the v2 URI and mirror it in `openai/outputTemplate` for compatibility.
4. Serve the widget resource with `_meta.ui.prefersBorder: false`, `openai/widgetPrefersBorder: false`, and `openai/widgetDescription`.
5. Deliver updates through MCP Apps `ui/notifications/tool-result`, `openai:set_globals`, or widget-initiated progress polling.

The widget must not fetch localhost directly. In ChatGPT/Codex hosts it uses `window.openai.callTool` for refreshes, reads `window.openai.maxHeight`, and reports changes through `window.openai.notifyIntrinsicHeight`.

## Recommended State Shape

```json
{
  "jobID": "job-id",
  "projectName": "Launch Loop",
  "connectionLabel": "LitSquare Stage macOS app",
  "status": "running",
  "summary": "Rendering video.",
  "kind": "video",
  "outputFormat": "h264Mp4",
  "frame": 95,
  "completedFrames": 96,
  "totalFrames": 180,
  "progress": 53.3,
  "fps": 30,
  "width": 1080,
  "height": 1080,
  "remainingSeconds": 42,
  "motionBlur": {
    "enabled": true,
    "sampleCount": 8,
    "shutterAngle": 180
  },
  "preview": {
    "dataURL": "data:image/png;base64,...",
    "width": 1080,
    "height": 1080,
    "label": "Frame 95"
  },
  "artifacts": [],
  "events": [],
  "diagnostics": [],
  "terminal": false,
  "nextRefreshMs": 2000
}
```

`frame` remains the current zero-based render frame for compatibility and preview indexing. `completedFrames` is the human-readable completed count used by the widget. Terminal states omit `remainingSeconds`; completed jobs report 100 percent and `completedFrames == totalFrames`.

## Display Policy

- No preview space is reserved until a preview exists; active jobs show only `Preview pending`.
- The latest preview is retained only within the same `jobID`.
- Completed states suppress redundant completion copy and stale ETA values.
- Failed states automatically disclose up to three diagnostics.
- Details show at most two artifacts, three events, and three diagnostics.
- Render and queue controls remain in MCP tools and the macOS app.
