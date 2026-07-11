# External Inputs

## Figma

Use Figma as design input, not as render state. Extract frame dimensions, layout, typography, colors, image assets, SVG paths, and component hierarchy. Convert those into local HTML, CSS, JS, and assets before rendering.

## APIs

Snapshot API responses into local JSON before rendering. Store the source URL, request time, and relevant parameters in an output manifest. Never make network calls inside `renderFrame`.

## CSV and JSON

Normalize rows into a stable internal model. Validate required columns, units, dates, and missing values before animation.

## Images and Screenshots

Copy images into project assets. Decode them in `prepareExport`. Use high-resolution source media for 4K/8K.

## Fonts

Store fonts locally when licensing allows. Wait for `document.fonts.ready`. Drive variable font axes from frame-derived values.

## Audio

Use `renderOfflineAudio` for exportable audio. Keep preview playback and offline render paths equivalent.
