import assert from "node:assert/strict";
import test from "node:test";
import {
  StageMCPClient,
  removeUndefined
} from "../plugins/litsquare-stage-animation/scripts/stage-mcp-client.mjs";

function jsonResponse(value, status = 200) {
  return new Response(value == null ? "" : JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("shared MCP client initializes once and uses the negotiated protocol", async () => {
  const calls = [];
  const fetchImpl = async (_url, options) => {
    const payload = JSON.parse(options.body);
    calls.push({ payload, headers: options.headers });
    if (payload.method === "initialize") {
      return jsonResponse({
        jsonrpc: "2.0",
        id: payload.id,
        result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "stage", version: "1" } }
      });
    }
    if (payload.method === "notifications/initialized") {
      return jsonResponse(null, 202);
    }
    return jsonResponse({ jsonrpc: "2.0", id: payload.id, result: { tools: [] } });
  };

  const client = new StageMCPClient({ fetchImpl });
  await Promise.all([client.listTools(), client.listTools()]);

  assert.equal(calls.filter((call) => call.payload.method === "initialize").length, 1);
  assert.equal(calls.filter((call) => call.payload.method === "notifications/initialized").length, 1);
  assert.equal(calls[0].payload.params.protocolVersion, "2025-11-25");
  for (const call of calls.filter((entry) => entry.payload.method !== "initialize")) {
    assert.equal(call.headers["mcp-protocol-version"], "2025-06-18");
    assert.equal(call.headers.accept, "application/json, text/event-stream");
  }
});

test("shared MCP client normalizes tool failures", async () => {
  const fetchImpl = async (_url, options) => {
    const payload = JSON.parse(options.body);
    if (payload.method === "initialize") {
      return jsonResponse({ jsonrpc: "2.0", id: payload.id, result: { protocolVersion: "2025-11-25" } });
    }
    if (payload.method === "notifications/initialized") return jsonResponse(null, 202);
    return jsonResponse({
      jsonrpc: "2.0",
      id: payload.id,
      result: { isError: true, content: [{ type: "text", text: "render failed" }] }
    });
  };

  const client = new StageMCPClient({ fetchImpl });
  await assert.rejects(() => client.callTool("litsquare_stage_render_progress"), /render failed/);
});

test("shared MCP client removes undefined arguments recursively", () => {
  assert.deepEqual(removeUndefined({ one: 1, omitted: undefined, nested: { two: 2, omitted: undefined } }), {
    one: 1,
    nested: { two: 2 }
  });
});

test("bundled scripts contain no raw tool-envelope requests", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const scriptsURL = new URL("../plugins/litsquare-stage-animation/scripts/", import.meta.url);
  const files = (await readdir(scriptsURL)).filter((name) => name.endsWith(".mjs"));
  for (const name of files) {
    const source = await readFile(new URL(name, scriptsURL), "utf8");
    assert.doesNotMatch(source, /JSON\.stringify\s*\(\s*\{\s*tool\s*[,}]/, name);
  }
});
