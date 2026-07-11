# Claude Code Integration

Claude Code installs LitSquare Stage from the shared marketplace and connects to the macOS companion app through Streamable HTTP MCP.

```bash
claude plugin marketplace add thierryc/litsquare-stage-integrations
claude plugin install litsquare-stage-animation@litsquare-stage --scope user
```

Run `/reload-plugins` after installation or updates. Use `/mcp` to confirm that `litsquare-stage-macos` is connected at `http://127.0.0.1:7460/mcp`.

Claude Code receives the same canonical `litsquare_stage_*` render tools and structured progress data as Codex. Codex-specific `_meta["openai/outputTemplate"]` widget metadata is optional for Claude Code and must not be treated as a Claude rendering requirement.

If the plugin is unavailable, verify that the LitSquare Stage app is running before changing client configuration. Do not add a second direct MCP registration when the plugin-provided endpoint is already connected.

