# QA Checklist

## Before Render

- `stage.config.json` has explicit preview and render settings.
- Frame range matches requested duration.
- Assets are local and loaded.
- Fonts are ready in `prepareExport`.
- API inputs are snapshotted.
- Render path passed `scripts/check-stage-app.mjs`.

## Still Checks

- First frame is not blank.
- Key reveal frames are not blank.
- Final frame is not blank unless intended.
- Dimensions match the requested output.
- Text is readable and not clipped.
- Safe areas are respected.

## Video Checks

- Artifact exists and is non-empty.
- Duration equals `(endFrame - startFrame + 1) / fps`.
- FPS matches config.
- Motion blur looks intentional and does not smear UI text excessively.
- Audio is present only when requested.
- Loop start/end is clean for looping videos.

## High-Resolution Checks

- Inspect at 100% for aliasing, thin lines, and texture resolution.
- Use a lower-resolution approval render before 4K/8K.
- Confirm estimated render time before enabling high sample-count blur.
