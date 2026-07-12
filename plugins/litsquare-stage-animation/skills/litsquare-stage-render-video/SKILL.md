---
name: litsquare-stage-render-video
description: Render LitSquare Stage projects through the mandatory macOS app. Use for app preflight, still capture, PNG sequences, MP4/MOV export, motion blur render settings, render queue controls, diagnostics, inline render progress, artifact QA, and render troubleshooting.
---

# LitSquare Stage Render Video

Use for every still, sequence, video, queue, progress, and diagnostics operation.

## Mandatory Preflight

Use MCP-first preflight before every render:

1. If the canonical `litsquare_stage_render_progress` tool is available, call it without a `jobID`.
2. Treat a valid structured progress response, including `idle`, as authoritative proof that the LitSquare Stage service and plugin MCP transport are ready.
3. Confirm that `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_set_render_window_state` are available before the corresponding workflow needs them.
4. Do not run the shell preflight when the canonical MCP tools are available.

Only when direct MCP tools are unavailable, run:

```bash
node plugins/litsquare-stage-animation/scripts/check-stage-app.mjs
```

The fallback script requires localhost network access. If it reports `service_unreachable` for an installed or running app from a sandboxed command:

- Do not tell the user to restart the app based only on that shell failure.
- Prefer the direct MCP tool result.
- If direct MCP tools are absent, request permission for a read-only localhost probe or report that the client has not loaded the plugin MCP server.

Passing readiness requires macOS plus a healthy native `litsquare-stage-macos` service and the canonical render tools. Treat `debug_app_unregistered` as a non-blocking developer warning when the verified native service is healthy.

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
