# LitSquare Stage App Contract

The LitSquare Stage macOS app is the only render host enabled by this plugin version.

## Local Endpoints

- Health: `http://127.0.0.1:7460/healthz`
- MCP shell: `http://127.0.0.1:7460/mcp`
- Event stream: `http://127.0.0.1:7460/mcp/events`

When canonical MCP tools are available, call `litsquare_stage_render_progress` first and treat a valid structured response as authoritative readiness. Use `scripts/check-stage-app.mjs` only when direct MCP tools are unavailable and localhost access is permitted. A failed sandboxed shell request to `127.0.0.1` does not prove the app service is down.

## Tool Envelope

The app exposes two MCP-compatible surfaces at the same endpoint:

- JSON-RPC MCP, used by Codex connector tools and inline widgets.
- REST-style HTTP shell JSON, used by local CLI fallback scripts.

For Codex-visible render progress, use JSON-RPC. The REST shell status is not sufficient to mount a widget in the conversation.

## JSON-RPC Widget Bridge

The JSON-RPC MCP interface supports:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/templates/list`
- `resources/read`

Widget-capable tools:

- `litsquare_stage_start_video_render`
- `litsquare_stage_start_sequence_render`
- `litsquare_stage_render_progress`

Window feedback tool:

- `litsquare_stage_set_render_window_state`: show, hide, front, back, compact, float, or position the native render window while using MCP render tools.

The render progress widget resource is:

```text
ui://widget/litsquare-stage-render-progress-v2.html
```

Its MIME type is:

```text
text/html+skybridge
```

Tool descriptors and tool results that should render inline in Codex must include:

```json
{
  "_meta": {
    "ui": {
      "resourceUri": "ui://widget/litsquare-stage-render-progress-v2.html"
    },
    "openai/outputTemplate": "ui://widget/litsquare-stage-render-progress-v2.html",
    "openai/widgetAccessible": true
  }
}
```

Progress tool results must return `structuredContent` with at least `projectName`, `status`, `summary`, `jobID`, `frame`, `completedFrames`, `totalFrames`, `progress`, `remainingSeconds`, `kind`, `outputFormat`, `fps`, `width`, `height`, `motionBlur`, `artifacts`, `events`, `diagnostics`, and `updatedAt`. Preview pixels, when included, must be a bounded reduced PNG data URL at `preview.dataURL`.

## REST Shell Envelope

The app HTTP shell accepts JSON:

```json
{
  "tool": "load_project",
  "payload": {
    "projectRoot": "/absolute/project"
  }
}
```

Successful responses use:

```json
{
  "ok": true,
  "data": {}
}
```

Failures use:

```json
{
  "ok": false,
  "error": "message"
}
```

## Tools

- `load_project`: load a project root containing `stage.config.json`.
- `get_project_status`: inspect manifest, server state, current job, queue, events, logs, and diagnostics.
- `capture_frame`: render one PNG frame.
- `render_sequence`: render a PNG sequence.
- `render_video`: render deterministic H.264 MP4 or MOV.
- `list_render_jobs`: inspect queue and recent jobs.
- `wait_for_render_job`: wait for active or requested job completion.
- `cancel_render_job`: cancel an active or queued job.
- `pause_render_queue`, `resume_render_queue`, `restart_render_queue`: control long renders.
- `bring_render_window_front`, `send_render_window_back`, `hide_render_window`, `show_render_window`: manage the app render window when available.
- `set_render_window_state`: consolidated REST-shell alias for visibility, compact mode, floating mode, and position.

## Native Video Authority

`render_video` and `litsquare_stage_start_video_render` own the complete final-video pipeline: frame rendering, motion-blur sampling, audio rendering, H.264 encoding, MP4/MOV container creation, muxing, and metadata. A final video must be the artifact returned by the LitSquare Stage app.

Do not render a sequence and invoke FFmpeg, a browser recorder, an AVFoundation helper, or another external encoder. Do not transcode a native app artifact to derive social variants. Submit a distinct native video job for every requested target. If the requested codec or container is unsupported, report the limitation instead of silently changing the pipeline.

## Request Shapes

```json
{ "projectRoot": "/absolute/project" }
```

```json
{ "frame": 42, "outputPath": "/absolute/frame.png", "overwrite": true }
```

```json
{ "startFrame": 0, "endFrame": 179, "outputPath": "/absolute/frames", "overwrite": true }
```

```json
{
  "startFrame": 0,
  "endFrame": 179,
  "outputPath": "/absolute/video.mp4",
  "overwrite": true,
  "videoMode": "deterministic",
  "videoOutput": "h264Mp4"
}
```

```json
{
  "visibility": "front",
  "compactMode": false,
  "floating": false,
  "position": {
    "x": 24,
    "y": 24
  }
}
```

`position.x` and `position.y` are top-left offsets in macOS points relative to the current screen visible frame. The app clamps the window so it remains visible. Successful window-state responses include `action`, `applied`, `visibility`, `compactMode`, `floating`, `frame`, `message`, and `updatedAt`.

## Native Window Feedback

Agents should use the native LitSquare Stage window as live feedback when MCP window control is available:

- Before still capture or quick frame inspection, call `litsquare_stage_set_render_window_state` with `visibility: "front"` and `compactMode: true`.
- Before video renders, long sequences, or progress monitoring, call it with `visibility: "front"` and `compactMode: false`.
- Use `floating: true` only when persistent visible render status helps the user; otherwise leave floating unchanged or false.
- Hide or send back the window only after completion or when the user asks for less visual interruption.

## Diagnostics

On failure, inspect `get_project_status` before changing code. Useful sources are runtime logs, diagnostics, queue state, current job error message, event stream, and artifact paths.

## Progress UI

The macOS app owns and serves the display-only compact render progress widget. The plugin keeps only the state contract and app-backed preview helper; it does not ship duplicate HTML, CSS, or JavaScript.

The app feeds the widget with render snapshots through MCP Apps `ui/notifications/tool-result`, `openai:set_globals`, or widget-initiated `litsquare_stage_render_progress` polling. Queue controls remain in MCP tools.

To render the widget inside a Codex conversation, use the JSON-RPC UI-bearing tool bridge:

- Serve the app resource at `ui://widget/litsquare-stage-render-progress-v2.html`.
- Return render progress as `structuredContent`, including human-readable `completedFrames`.
- Add standard `_meta.ui.resourceUri` and mirror it with `_meta["openai/outputTemplate"]`.
- Set resource metadata `_meta.ui.prefersBorder: false`, `openai/widgetPrefersBorder: false`, and `openai/widgetDescription`.
- Send preview pixels only as reduced base64 PNG data URLs in `structuredContent.preview.dataURL`; do not expose raw thumbnail paths or full-size cached thumbnails.
- Report intrinsic height after state, preview, and detail changes so the host does not clip the card.

The agent must call the JSON-RPC widget tools through the MCP connection rather than raw REST shell calls.
