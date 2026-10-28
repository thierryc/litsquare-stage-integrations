import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isProgressTerminal,
  resolveTimeouts,
  summarizeProgressState
} from "../plugins/litsquare-stage-animation/scripts/render-stage-project.mjs";

test("render CLI uses separate timeout defaults", () => {
  assert.deepEqual(resolveTimeouts({}), {
    probeTimeoutMs: 5000,
    operationTimeoutMs: 60000,
    waitTimeoutSeconds: 3600
  });
});

test("legacy timeout only overrides probe and operation requests", () => {
  assert.deepEqual(resolveTimeouts({ timeoutMs: "9000" }), {
    probeTimeoutMs: 9000,
    operationTimeoutMs: 9000,
    waitTimeoutSeconds: 3600
  });
});

test("explicit timeout flags take precedence", () => {
  assert.deepEqual(resolveTimeouts({
    timeoutMs: "9000",
    probeTimeoutMs: "1200",
    operationTimeoutMs: "45000",
    waitTimeoutSeconds: "7200"
  }), {
    probeTimeoutMs: 1200,
    operationTimeoutMs: 45000,
    waitTimeoutSeconds: 7200
  });
});

test("progress terminal state recognizes server flag and terminal statuses", () => {
  assert.equal(isProgressTerminal({ terminal: true, status: "idle" }), true);
  assert.equal(isProgressTerminal({ terminal: false, status: "completed" }), true);
  assert.equal(isProgressTerminal({ terminal: false, status: "running" }), false);
});

test("CLI progress summaries omit embedded preview payloads", () => {
  const summary = summarizeProgressState({
    status: "completed",
    preview: { frame: 1, dataURL: "data:image/png;base64,large" },
    previews: [{ kind: "contactSheet", dataURL: "data:image/png;base64,large" }]
  });
  assert.equal(summary.preview.dataURL, undefined);
  assert.equal(summary.preview.previewEmbedded, true);
  assert.equal(summary.previews[0].dataURL, undefined);
  assert.equal(summary.previews[0].previewEmbedded, true);
});

test("frame CLI uses the advertised still-export tool after MCP initialization", { skip: process.platform !== "darwin" }, async () => {
  const calls = [];
  const server = createServer(async (request, response) => {
    if (request.method === "GET") { response.end("ok"); return; }
    let body = "";
    for await (const chunk of request) body += chunk;
    const message = JSON.parse(body);
    if (!message.id) { response.writeHead(202); response.end(); return; }
    let result;
    if (message.method === "initialize") result = { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "stage-test", version: "1" } };
    else if (message.method === "tools/list") result = { tools: [{ name: "litsquare_stage_start_video_render" }, { name: "litsquare_stage_export_still" }] };
    else {
      calls.push(message.params);
      if (message.params.name !== "litsquare_stage_export_still") {
        response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Unadvertised tool" } })); return;
      }
      result = { structuredContent: { artifacts: [{ path: message.params.arguments.outputPath }] } };
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const root = await mkdtemp(path.join(os.tmpdir(), "stage-frame-cli-"));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const script = fileURLToPath(new URL("../plugins/litsquare-stage-animation/scripts/render-stage-project.mjs", import.meta.url));
    const output = path.join(root, "frame.png");
    const { stdout } = await promisify(execFile)(process.execPath, [script, "--kind", "frame", "--project", root,
      "--output", output, "--frame", "12", "--mcp-url", `${base}/mcp`, "--health-url", `${base}/healthz`]);
    assert.equal(JSON.parse(stdout).ok, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { name: "litsquare_stage_export_still", arguments: {
      sourceType: "stageProject", projectRoot: root, format: "png", frame: 12, outputPath: output, overwrite: false
    } });
  } finally {
    await rm(root, { recursive: true, force: true });
    await new Promise(resolve => server.close(resolve));
  }
});
