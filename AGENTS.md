# LitSquare Stage Codex Plugin Repository

- Keep the plugin installable through `.agents/plugins/marketplace.json` and `plugins/litsquare-stage-animation/.codex-plugin/plugin.json`.
- Run the plugin validator after manifest, skill, marketplace, or asset changes:

  ```bash
  python3 /Users/thierryc/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/litsquare-stage-animation
  ```

- Run `node --check plugins/litsquare-stage-animation/scripts/*.mjs` after script changes.
- Keep templates deterministic: export-critical state must come from LitSquare Stage `FrameContext`.
- Current rendering workflows must require the LitSquare Stage macOS app. Do not add Chromium, Playwright, or hosted-service fallback behavior until the repository includes a checked script or MCP configuration for that path.
- Put reusable Codex behavior in skills. Keep prompt files as reference assets because current Codex documentation recommends skills over custom prompts for shared workflows.
