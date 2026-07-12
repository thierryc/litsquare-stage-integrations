# LitSquare Stage Rendering Reference

## Known MCP Concepts

LitSquare Stage render hosts expose render-oriented resources and tools. Use these names as the contract to look for when an MCP connection is available.

Resources:

- `litsquare-stage://project/manifest`
- `litsquare-stage://server/state`
- `litsquare-stage://render/job/current`
- `litsquare-stage://render/queue`
- `litsquare-stage://render/events/recent`
- `litsquare-stage://logs/runtime`
- `litsquare-stage://diagnostics/current`

Tools:

- `load_project`
- `build_project`
- `get_project_status`
- `set_render_config`
- `capture_frame`
- `render_sequence`
- `render_video`
- `list_render_jobs`
- `wait_for_render_job`
- `cancel_render_job`
- `pause_render_queue`
- `resume_render_queue`
- `restart_render_queue`
- `bring_render_window_front`
- `send_render_window_back`
- `hide_render_window`
- `show_render_window`
- `set_render_window_state`

JSON-RPC MCP window feedback tool:

- `litsquare_stage_set_render_window_state`

Progress UI:

- Source template: `apps/render-progress/`
- Bundled widget: `assets/render-progress-widget.html`
- State contract: `references/render-progress-ui.md`
- Claude Code activation and reload behavior: `references/claude-code-integration.md`

## Project Config

LitSquare Stage projects use `stage.config.json`:

```json
{
  "name": "Example Stage",
  "sourceEntry": "src/main.ts",
  "buildDir": "build",
  "preview": {
    "fps": 30,
    "width": 1280,
    "height": 720,
    "durationFrames": 180,
    "loop": true
  },
  "render": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "videoOutput": "h264Mp4",
    "videoMode": "deterministic",
    "motionBlur": {
      "enabled": true,
      "shutterAngle": 180,
      "sampleCount": 8
    },
    "snapshotWaitMs": 0,
    "maxWorkerCount": 4
  }
}
```

## Mandatory App Preflight

Before a render, verify:

1. The operating system is macOS.
2. The LitSquare Stage app is installed in `/Applications/LitSquare Stage.app` or `$HOME/Applications/LitSquare Stage.app`, or is otherwise discoverable by an installed MCP/app integration.
3. The app or its MCP endpoint is reachable before calling render tools.

If any check fails, stop and show the mandatory-app message. Do not silently switch to the Chromium renderer.

## Native Window Feedback

When the MCP window feedback tool is available, use the native app window to show render status to the user:

- For still capture and quick image/frame inspection, call `litsquare_stage_set_render_window_state` with `visibility: "front"` and `compactMode: true`.
- For video renders, long PNG sequences, or progress monitoring, call `litsquare_stage_set_render_window_state` with `visibility: "front"` and `compactMode: false`.
- Use `floating: true` only when persistent visible status benefits the user; otherwise leave floating unchanged or false.
- Hide or send back the window only after completion or when requested.

## Scripts

- `scripts/check-stage-app.mjs`: fallback JSON readiness check for clients without direct MCP tools; requires permitted localhost access.
- `scripts/render-stage-project.mjs`: JSON render client for frame, sequence, and video jobs.
- `scripts/get-render-progress-state.mjs`: adapts app render status into progress-widget JSON.
- `scripts/build-render-progress-widget.mjs`: rebuilds the single-file progress widget asset.
