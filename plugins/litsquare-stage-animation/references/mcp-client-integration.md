# MCP Client Integration

LitSquare Stage exposes one portable Streamable HTTP MCP endpoint:

```text
http://127.0.0.1:7460/mcp
```

## Client setup

- Codex and Claude Code use the plugin's `.mcp.json` directly.
- Cursor and other MCP-capable coding agents should register the same URL as an HTTP or Streamable HTTP server using that client's native configuration.
- Keep one connection to the endpoint. Do not add a stdio proxy or a second direct registration when the plugin already supplies it.
- Confirm the connection with MCP `initialize` and `tools/list`, not a raw localhost health probe from a sandbox.
- Prefer protocol `2025-11-25`; the app also accepts `2025-06-18`, `2025-03-26`, and `2024-11-05`.

## Portable behavior

- Use `litsquare_stage_start_video_render`, `litsquare_stage_start_sequence_render`, and `litsquare_stage_render_progress` when available.
- Treat `structuredContent` as the portable machine-readable result. Text content is the human-readable fallback.
- Treat `_meta.ui.resourceUri` and `_meta["openai/outputTemplate"]` as optional presentation hints. A client does not need to render the widget to use every render tool.
- Poll progress with the returned `jobID`; do not infer the current retry from unscoped historical logs.
- When the client cannot call MCP tools directly, use the bundled Node scripts. They share `scripts/stage-mcp-client.mjs`, initialize once, and use standard JSON-RPC MCP.
- Never construct the deprecated `{tool,payload}` envelope. It remains server-side only for `0.9.x` migration and is removed in `1.0`.

The app may add optional fields without breaking clients. Clients should ignore unknown result and `_meta` fields.
