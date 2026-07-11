# Render Progress UI

The render progress UI displays LitSquare Stage app render state inside a conversation, app panel, or local preview surface.

## Files

- Source HTML: `apps/render-progress/index.html`
- Source CSS: `apps/render-progress/styles.css`
- Source JavaScript: `apps/render-progress/progress.js`
- Sample payload: `apps/render-progress/sample-state.json`
- Bundled HTML asset: `assets/render-progress-widget.html`
- App-state adapter: `scripts/get-render-progress-state.mjs`
- Local preview URL helper: `scripts/make-render-progress-preview-url.mjs`

Rebuild the bundled asset after source edits:

```bash
node plugins/litsquare-stage-animation/scripts/build-render-progress-widget.mjs
```

## Local Template Test

Use the local template test to verify that the HTML, CSS, JavaScript, and state payload render before testing a Codex conversation surface:

```bash
node plugins/litsquare-stage-animation/scripts/build-render-progress-widget.mjs
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
```

Open the returned `url` in a browser. The page should show the sample project name, progress bar, metrics, artifacts, events, and diagnostics from `apps/render-progress/sample-state.json`.

To preview a live or completed LitSquare Stage app render job:

```bash
node plugins/litsquare-stage-animation/scripts/get-render-progress-state.mjs --project /absolute/project > /tmp/stage-progress.json
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json
```

In Codex sandboxed sessions, the `get-render-progress-state.mjs` command may need local-network permission because it calls `http://127.0.0.1:7460/mcp`. The `make-render-progress-preview-url.mjs` command is offline and reads local files only.

## Codex Conversation Test

A static HTML file in `assets/` is not automatically rendered inside a Codex conversation. The conversation must use the LitSquare Stage app JSON-RPC MCP bridge, not the REST-style shell envelope. The bridge needs:

1. Serves or registers the bundled widget HTML as a widget resource, for example `ui://widget/litsquare-stage-render-progress.html`.
2. Exposes tools such as `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress`.
3. Returns the progress state as `structuredContent`.
4. Points Codex at the widget resource through tool metadata such as `_meta["openai/outputTemplate"]`.
5. Includes the widget HTML in the matching resource response.
6. Updates the widget through host-provided state, `postMessage`, or repeated tool calls while the render job runs.

A minimal tool result should follow this shape:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Showing LitSquare Stage render progress."
    }
  ],
  "structuredContent": {
    "projectName": "anotherplanet-cube-litsquare-stage",
    "status": "running",
    "frame": 12,
    "totalFrames": 30
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/litsquare-stage-render-progress.html",
    "openai/toolInvocation/invoking": "Loading LitSquare Stage render progress",
    "openai/toolInvocation/invoked": "LitSquare Stage render progress loaded",
    "openai/widgetAccessible": true
  }
}
```

The widget resource should return `assets/render-progress-widget.html` with a `text/html` or `text/html+skybridge` MIME type, depending on the host runtime.

The REST-style `/mcp` GET and `{ "tool": "render_video" }` shell calls are useful for CLI automation, but they return ordinary JSON and cannot cause Codex to mount the widget. The pass criterion for the in-conversation test is a rendered progress card in the Codex transcript after a JSON-RPC connector tool call, not just a file URL or text summary.

## State Delivery

The widget accepts state through:

- embedded JSON in `#stage-progress-state`
- base64url JSON in a `state` query parameter
- `window.postMessage({ type: "litsquare-stage-render-progress", state })`
- `window["litsquare-stage-render-progress"].render(state)`
- `window.openai.toolOutput` plus `window.openai.callTool("litsquare_stage_render_progress", { jobID })` inside Codex widget hosts

For conversation rendering, use the JSON-RPC MCP tool output path. The widget must not fetch `127.0.0.1` directly; refreshes go through `window.openai.callTool`.

Preview images in MCP `structuredContent.preview.dataURL` must be reduced PNG data URLs before sending. The macOS app should downscale cached thumbnails for transport and keep each PNG payload bounded so repeated progress refreshes do not flood the conversation.

To produce a widget-compatible JSON snapshot from the local app:

```bash
node plugins/litsquare-stage-animation/scripts/get-render-progress-state.mjs --project /absolute/project
```

## Recommended State Shape

```json
{
  "projectName": "Launch Loop",
  "connectionLabel": "LitSquare Stage macOS app",
  "status": "running",
  "summary": "Rendering 4K approval MP4 with final motion blur.",
  "kind": "video",
  "outputFormat": "h264Mp4",
  "frame": 96,
  "totalFrames": 180,
  "fps": 30,
  "width": 3840,
  "height": 2160,
  "remainingSeconds": 42,
  "motionBlur": {
    "enabled": true,
    "sampleCount": 8,
    "shutterAngle": 180
  },
  "artifacts": [
    {
      "name": "Approval still",
      "path": "/absolute/render/frame-096.png",
      "sizeBytes": 4872192,
      "width": 3840,
      "height": 2160
    }
  ],
  "events": [
    {
      "timestamp": "2026-06-04T18:41:20.000Z",
      "message": "Frame 96 captured",
      "frame": 96
    }
  ],
  "diagnostics": [
    {
      "level": "warning",
      "message": "High-resolution motion blur can increase render time.",
      "source": "render.motionBlur"
    }
  ],
  "updatedAt": "2026-06-04T18:41:20.000Z"
}
```

## App Mapping

The LitSquare Stage app should map:

- `get_project_status.manifest` to project name, fps, width, height, duration frames, and render settings.
- current render job to status, frame, total frames, ETA, output kind, output format, and artifact paths.
- `/mcp/events` to recent event rows.
- diagnostics/log warnings to the diagnostics list.

Supported statuses include `idle`, `queued`, `running`, `rendering`, `paused`, `completed`, `failed`, and `cancelled`.

## Display Policy

The bundled widget is display-only in this version. Keep queue control actions in app/MCP tools:

- `cancel_render_job`
- `pause_render_queue`
- `resume_render_queue`
- `restart_render_queue`
- window show/hide/front/back tools

This keeps the conversation UI safe to embed before endpoint auth, allowed-root checks, and user-consent rules are finalized.
