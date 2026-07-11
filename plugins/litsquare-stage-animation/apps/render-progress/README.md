# LitSquare Stage Render Progress UI

This template is the source UI for displaying LitSquare Stage render progress in a conversation, app panel, or local preview surface.

It is intentionally static and dependency-free:

- `index.html`: semantic document shell.
- `styles.css`: responsive light/dark UI.
- `progress.js`: normalizes render state and updates the UI.
- `sample-state.json`: example payload.

## State Inputs

The UI accepts state through any of these paths:

1. Embedded JSON in `#stage-progress-state`.
2. A URL query parameter named `state` containing base64url JSON.
3. `window.postMessage({ type: "litsquare-stage-render-progress", state })`.
4. Direct calls to `window["litsquare-stage-render-progress"].render(state)`.

The macOS app should prefer `postMessage` or direct rendering when embedding this template because it avoids exposing localhost fetches from the HTML surface.

## Local Preview

From the plugin repository root, rebuild the bundled single-file widget and print a browser URL with the sample state embedded:

```bash
node plugins/litsquare-stage-animation/scripts/build-render-progress-widget.mjs
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
```

Open the returned `url` to verify the progress UI without the LitSquare Stage app or Codex app bridge.

To preview app-derived state:

```bash
node plugins/litsquare-stage-animation/scripts/get-render-progress-state.mjs --project /absolute/project > /tmp/stage-progress.json
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json
```

The HTML template does not poll localhost. Conversation rendering requires a Codex app/MCP tool that supplies this state and points the host at the widget resource.

## Minimum State

```json
{
  "projectName": "Launch Loop",
  "status": "running",
  "frame": 96,
  "totalFrames": 180,
  "fps": 30,
  "width": 3840,
  "height": 2160
}
```

## Recommended State

Use the richer shape in `sample-state.json` for production:

- `projectName`
- `connectionLabel`
- `status`
- `summary`
- `kind`
- `outputFormat`
- `frame`
- `totalFrames`
- `fps`
- `width`
- `height`
- `remainingSeconds` or `etaLabel`
- `motionBlur`
- `artifacts`
- `events`
- `diagnostics`
- `updatedAt`

## App Contract

The LitSquare Stage app can derive this state from:

- `get_project_status`
- `list_render_jobs`
- render job event stream payloads from `/mcp/events`
- render job results from `capture_frame`, `render_sequence`, and `render_video`

Keep render control actions outside this static template in v1. The UI is display-only so it can be safely embedded in Codex conversation surfaces.
