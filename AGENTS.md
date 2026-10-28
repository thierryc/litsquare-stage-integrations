# LitSquare Stage Codex Plugin Repository

- Keep the plugin installable through `.agents/plugins/marketplace.json` and `plugins/litsquare-stage-animation/.codex-plugin/plugin.json`.
- Run the plugin validator after manifest, skill, marketplace, or asset changes:

  ```bash
  python3 -m pip install -r release/requirements-validation.txt
  python3 release/scripts/validate_plugin.py plugins/litsquare-stage-animation
  python3 -m unittest discover -s tests -p 'test_*.py'
  ```

  This repository-owned release gate checks the supported Codex/Claude compatibility layout, skill metadata, safe package paths, assets, endpoint, marketplace references and version agreement. It is not an OpenAI certification tool. The external plugin-creator script is no longer a prerequisite.

- Run `for stage_script in plugins/litsquare-stage-animation/scripts/*.mjs; do node --check "$stage_script" || exit; done` after script changes.
- Keep templates deterministic: export-critical state must come from LitSquare Stage `FrameContext`.
- Current rendering workflows must require the LitSquare Stage macOS app. Do not add Chromium, Playwright, or hosted-service fallback behavior until the repository includes a checked script or MCP configuration for that path.
- Put reusable Codex behavior in skills. Keep prompt files as reference assets because current Codex documentation recommends skills over custom prompts for shared workflows.
