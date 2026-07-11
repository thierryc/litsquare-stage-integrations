# LitSquare Stage Integrations

This repository packages the shared `litsquare-stage-animation` plugin for Codex and Claude Code. It gives both clients reusable skills and the local MCP connection needed to create code-first LitSquare Stage animations and render them through the LitSquare Stage macOS app.

## Layout

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
plugins/litsquare-stage-animation/.codex-plugin/plugin.json
plugins/litsquare-stage-animation/.claude-plugin/plugin.json
plugins/litsquare-stage-animation/.mcp.json
plugins/litsquare-stage-animation/skills/
plugins/litsquare-stage-animation/prompts/
plugins/litsquare-stage-animation/references/
plugins/litsquare-stage-animation/scripts/
plugins/litsquare-stage-animation/apps/render-progress/   # widget source, not a ChatGPT app registration
plugins/litsquare-stage-animation/assets/
plugins/litsquare-stage-animation/templates/
```

Both marketplaces resolve the same shared plugin payload. The shared MCP configuration explicitly declares its HTTP transport so both clients can load it while skills, scripts, templates, and references stay single-source.

## Install in Codex

From the published marketplace:

```bash
codex plugin marketplace add thierryc/litsquare-stage-integrations
codex plugin add litsquare-stage-animation@litsquare-stage
```

Start a new Codex task after installation.

## Install in Claude Code

```bash
claude plugin marketplace add thierryc/litsquare-stage-integrations
claude plugin install litsquare-stage-animation@litsquare-stage --scope user
```

Run `/reload-plugins` inside Claude Code after installation.

## Runtime Requirement

This first plugin version requires the LitSquare Stage macOS app. The bundled skills must verify that the session is running on macOS and that the app is installed before attempting to render.

Preflight treats the verified native `litsquare-stage-macos` service as authoritative. A running development build outside `/Applications` may pass with a `debug_app_unregistered` warning; unavailable or incompatible services return a precise remediation message.

## Future Service Path

The private `litsquare-stage-chromium` renderer defines the same render-oriented MCP concepts, but this plugin intentionally does not activate that path. The distributed plugin remains a macOS companion integration.

## Development Checks

```bash
python3 /Users/thierryc/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/litsquare-stage-animation
claude plugin validate .
node --check plugins/litsquare-stage-animation/scripts/check-stage-app.mjs
node --check plugins/litsquare-stage-animation/scripts/render-stage-project.mjs
node --check plugins/litsquare-stage-animation/scripts/get-render-progress-state.mjs
node --check plugins/litsquare-stage-animation/scripts/build-render-progress-widget.mjs
node --check plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
node --check plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs
node --test tests/*.test.mjs
node plugins/litsquare-stage-animation/scripts/build-render-progress-widget.mjs
node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
```

The preview URL command is the offline smoke test for the render-progress HTML template. It verifies that the bundled widget can load a valid state payload, but it does not prove Codex in-conversation rendering. In-conversation rendering requires the LitSquare Stage app JSON-RPC MCP bridge to expose `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, `litsquare_stage_render_progress`, and `ui://widget/litsquare-stage-render-progress.html` with `_meta["openai/outputTemplate"]`.

The render progress UI is served as an MCP widget resource by the LitSquare Stage macOS app. It is not installed through a ChatGPT app Connect redirect.

## Anotherplanet Smoke Render

With the LitSquare Stage macOS app running on `http://127.0.0.1:7460`, render the local `stages/anotherplanet-cube-litsquare-stage` smoke project through the plugin:

```bash
node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs
```

The smoke script validates app readiness, builds the stage with `pnpm build`, captures one PNG still, and renders a short H.264 MP4. It writes artifacts under `/tmp/stage-anotherplanet-smoke` by default.

For a local debug app bundle, pass the explicit bundle path:

```bash
node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs --app-path /private/tmp/LitSquare Stage Debug.app
```
