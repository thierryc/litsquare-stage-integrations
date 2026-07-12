# QA Checklist

## Before Render

- `stage.config.json` has explicit preview and render settings.
- Frame range matches requested duration.
- Assets are local and loaded.
- Fonts are ready in `prepareExport`.
- API inputs are snapshotted.
- MCP-first readiness passed through `litsquare_stage_render_progress`; use `scripts/check-stage-app.mjs` only when direct MCP tools are unavailable and localhost is permitted.

## Still Checks

- First frame is not blank.
- Key reveal frames are not blank.
- Final frame is not blank unless intended.
- Dimensions match the requested output.
- Text is readable and not clipped.
- Safe areas are respected.

## Video Checks

- Artifact exists and is non-empty.
- Artifact is the MP4/MOV returned by a terminal LitSquare Stage video render job.
- No FFmpeg or external encoder created, transcoded, scaled, padded, muxed, or rewrote the final video.
- Every requested social format has its own native LitSquare Stage video job and artifact.
- Duration equals `(endFrame - startFrame + 1) / fps`.
- FPS matches config.
- Motion blur looks intentional and does not smear UI text excessively.
- Audio is present only when requested.
- Loop start/end is clean for looping videos.

## High-Resolution Checks

- Inspect at 100% for aliasing, thin lines, and texture resolution.
- Use a lower-resolution approval render before 4K/8K.
- Confirm estimated render time before enabling high sample-count blur.
