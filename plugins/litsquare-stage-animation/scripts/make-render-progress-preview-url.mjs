#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MCP_URL = "http://127.0.0.1:7460/mcp";
const PROGRESS_TEMPLATE_URI = "ui://widget/litsquare-stage-render-progress-v3.html";
const args = parseArgs(process.argv.slice(2));

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const mcpURL = String(args.mcpUrl ?? process.env.STAGE_MCP_URL ?? DEFAULT_MCP_URL);
  const timeoutMs = numberArg(args.probeTimeoutMs ?? args.timeoutMs, 5000);
  const outputPath = path.resolve(String(args.output ?? path.join(os.tmpdir(), "litsquare-stage-render-progress-v3.html")));
  const widgetResponse = await jsonRPC(
    mcpURL,
    "resources/read",
    { uri: PROGRESS_TEMPLATE_URI },
    timeoutMs,
    1
  );
  const contents = Array.isArray(widgetResponse?.result?.contents) ? widgetResponse.result.contents : [];
  const resource = contents.find((entry) => entry?.uri === PROGRESS_TEMPLATE_URI);
  if (typeof resource?.text !== "string" || !resource.text.includes("litsquare-stage-render-progress")) {
    throw new Error("The running LitSquare Stage app did not return the v3 progress widget resource.");
  }

  const statePath = args.state ? path.resolve(String(args.state)) : null;
  const state = statePath
    ? JSON.parse(await readFile(statePath, "utf8"))
    : await fetchProgressState(mcpURL, timeoutMs, args.jobId);
  const stateParam = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  await writeFile(outputPath, resource.text, "utf8");
  const url = pathToFileURL(outputPath);
  url.searchParams.set("state", stateParam);

  console.log(JSON.stringify({
    ok: true,
    source: "LitSquare Stage macOS app MCP resource",
    widgetURI: PROGRESS_TEMPLATE_URI,
    mcpURL,
    outputPath,
    statePath,
    url: url.href
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
}

async function fetchProgressState(mcpURL, timeoutMs, jobID) {
  const argumentsValue = jobID ? { jobID: String(jobID) } : {};
  const response = await jsonRPC(
    mcpURL,
    "tools/call",
    { name: "litsquare_stage_render_progress", arguments: argumentsValue },
    timeoutMs,
    2
  );
  const state = response?.result?.structuredContent;
  if (!state || typeof state !== "object") {
    throw new Error("The running LitSquare Stage app did not return render progress state.");
  }
  return state;
}

async function jsonRPC(url, method, params, timeoutMs, id) {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json"
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
  }, timeoutMs);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`MCP ${method} failed with HTTP ${response.status}.`);
  }
  if (body?.error) {
    throw new Error(body.error.message ?? `MCP ${method} failed.`);
  }
  return body;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, character) => character.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
  node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --job-id JOB_ID
  node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json

Fetches the canonical v3 widget resource from the running LitSquare Stage macOS app,
writes a temporary HTML preview, and prints its file URL with render state attached.`);
}
