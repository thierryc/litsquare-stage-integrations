---
name: litsquare-stage-render-video
description: Render and natively encode LitSquare Stage projects through the mandatory macOS app. Use for app preflight, still capture, explicitly requested PNG sequences, final H.264 MP4/MOV encoding, motion blur render settings, render queue controls, diagnostics, inline render progress, artifact QA, and render troubleshooting.
---

# LitSquare Stage Render Video

Use for every still, sequence, video, queue, progress, and diagnostics operation.

All fallback scripts use `scripts/stage-mcp-client.mjs`, initialize once, and call standard JSON-RPC MCP. Never construct or send the deprecated raw `{tool,payload}` envelope.

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

For client registration or transport problems, read `references/mcp-client-integration.md` before changing MCP configuration.

The fallback script requires localhost network access. If it reports `service_unreachable` for an installed or running app from a sandboxed command:

- Do not tell the user to restart the app based only on that shell failure.
- Prefer the direct MCP tool result.
- If direct MCP tools are absent, request permission for a read-only localhost probe or report that the client has not loaded the plugin MCP server.

Passing readiness requires macOS plus a healthy native `litsquare-stage-macos` service and the canonical render tools. Treat `debug_app_unregistered` as a non-blocking developer warning when the verified native service is healthy.

Do not use Chromium, Playwright, browser automation, or a remote service as a fallback.

## Native Final Video Encoding

For every requested video deliverable, use `litsquare_stage_start_video_render` or the app-backed CLI with `--kind video`. LitSquare Stage owns frame rendering, motion-blur sampling, audio rendering, H.264 encoding, MP4/MOV container creation, muxing, and final metadata.

- Never create a final video by rendering a PNG sequence and passing it to FFmpeg or another encoder.
- Never use `ffmpeg`, a browser recorder, an AVFoundation helper script, or another external encoder for transcoding, scaling, padding, frame-rate conversion, audio muxing, metadata, or container creation.
- Use `litsquare_stage_start_sequence_render` only when the user explicitly requests an image sequence as the deliverable.
- For LinkedIn, Instagram, Bluesky, or any responsive pack, submit one native LitSquare Stage video render job per target size and output path. Do not render one master and transcode the variants externally.
- Set dimensions, fps, motion blur, codec/container, audio, and metadata in `stage.config.json` or the LitSquare Stage render request. Do not repair these properties in post-processing.
- If the app cannot produce the requested codec or container, stop and report that limitation. Do not silently substitute an external encoder.
- Verify completion from the app terminal progress state and returned video artifact. Use app-reported metadata or read-only file inspection for QA; do not mutate the artifact after the app returns it.

## Render Workflow

1. Inspect `stage.config.json`.
2. If audio is requested, read `references/audio-sync.md` and confirm `render.audioEnabled` is `true` in every target configuration.
3. Build the project using its package manager.
4. Run `validate-stage-project.mjs`.
5. Capture at least one still before long video or blurred renders.
6. Preserve the user's window visibility and focus during rendering:
   - The native renderer uses one compact layout for stills, sequences, and video.
   - Show or bring it forward only when the user requests visible progress or inspection; use `compactMode: true` for compatibility.
   - Set `floating: true` only when the user asks to keep the renderer on top.
   - Background rendering must finish without requiring foreground activation.
7. For video output, call `litsquare_stage_start_video_render` directly. Do not call the sequence tool as an intermediate video-encoding step.
8. Use `litsquare_stage_start_sequence_render` only for an explicitly requested image-sequence deliverable.
9. For long visible renders, poll `litsquare_stage_render_progress` with the returned `jobID` until that job is terminal. Treat its status and final events as authoritative; do not carry diagnostics from an older job into a retry.
10. Use `scripts/render-stage-project.mjs --kind video` only when canonical MCP tools are unavailable or CLI automation is required.
11. Verify artifact existence, non-zero size, dimensions, frame count or duration, fps, visible content, native-app provenance, and requested audio tracks.
12. Hand off to `litsquare-stage-quality-review`.

Canonical quick-start request:

```text
Render this LitSquare Stage project as a 1080 × 1080 H.264 MP4 for LinkedIn.
```

## Motion Blur

Read `references/motion-blur.md` before changing blur settings. Draft renders should use no blur or low samples; final renders default to `sampleCount: 8`, `shutterAngle: 180`.

## Output

Report project path, render settings, artifact paths, preflight status, progress mechanism, diagnostics warnings, and quality-review handoff.
