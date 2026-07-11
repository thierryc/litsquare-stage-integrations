---
name: litsquare-stage-render-video
description: Render LitSquare Stage projects through the mandatory macOS app. Use for app preflight, still capture, PNG sequences, MP4/MOV export, motion blur render settings, render queue controls, diagnostics, inline render progress, artifact QA, and render troubleshooting.
---

# LitSquare Stage Render Video

Use for every still, sequence, video, queue, progress, and diagnostics operation.

## Mandatory Preflight

Before any render operation, run:

```bash
node plugins/litsquare-stage-animation/scripts/check-stage-app.mjs
```

Passing readiness requires macOS plus a healthy native `litsquare-stage-macos` service, render tools, and the JSON-RPC render-progress bridge. Codex can use the bridge's inline widget metadata; Claude Code consumes the same structured progress tools. A standard app-bundle path is recommended but not required when the verified native service is already running.

If preflight fails, stop and display its `mandatoryMessage`. Treat `debug_app_unregistered` as a non-blocking developer warning when the native service, render tools, and widget bridge are healthy.

Do not use Chromium, Playwright, browser automation, or a remote service as a fallback.

## Render Workflow

1. Inspect `stage.config.json`.
2. Build the project using its package manager.
3. Run `validate-stage-project.mjs`.
4. Capture at least one still before long video or blurred renders.
5. Use `litsquare_stage_set_render_window_state` as live user feedback when MCP tools are available:
   - Before still capture or quick frame inspection, show and front the app window with `compactMode: true`.
   - Before video renders, long sequences, or progress monitoring, show and front the app window with `compactMode: false`.
   - Use `floating: true` only when persistent visible status helps the user; otherwise leave floating unchanged or false.
   - Hide or send back the window only after completion or when the user asks for less visual interruption.
6. For long visible renders, prefer the MCP widget tools: `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress`.
7. Use `scripts/render-stage-project.mjs` only when connector widget tools are unavailable or CLI automation is required.
8. Wait for completion.
9. Verify artifact existence, non-zero size, dimensions, frame count or duration, fps, and visible content.
10. Hand off to `litsquare-stage-quality-review`.

Canonical quick-start request:

```text
Render this LitSquare Stage project as a 1080 × 1080 H.264 MP4 for LinkedIn.
```

## Motion Blur

Read `references/motion-blur.md` before changing blur settings. Draft renders should use no blur or low samples; final renders default to `sampleCount: 8`, `shutterAngle: 180`.

## Output

Report project path, render settings, artifact paths, preflight status, progress mechanism, diagnostics warnings, and quality-review handoff.
