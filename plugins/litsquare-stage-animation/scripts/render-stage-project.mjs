#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_HEALTH_URL = "http://127.0.0.1:7460/healthz";
const DEFAULT_MCP_URL = "http://127.0.0.1:7460/mcp";
const MANDATORY_MESSAGE =
  "The LitSquare Stage native render service is not reachable. Launch or restart the macOS app and retry.";

const args = parseArgs(process.argv.slice(2));
const mcpURL = String(args.mcpUrl ?? process.env.STAGE_MCP_URL ?? DEFAULT_MCP_URL);
const healthURL = String(args.healthUrl ?? process.env.STAGE_HEALTH_URL ?? DEFAULT_HEALTH_URL);
const timeouts = resolveTimeouts(args);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

async function main() {
  try {
    if (args.help) {
      printUsage();
      process.exit(0);
    }

    const kind = String(args.kind ?? "video");
    const projectRoot = requirePath(args.project ?? args.projectRoot, "project");
    const outputPath = requirePath(args.output ?? args.outputPath, "output");

    if (!path.isAbsolute(outputPath)) {
      throw new Error("Output path must be absolute because the LitSquare Stage app render API requires absolute artifact paths.");
    }

    await assertAppReady(healthURL, mcpURL, timeouts.probeTimeoutMs);
    const result = await renderByKind(kind, projectRoot, outputPath);
    const finalJob = result.async
      ? await waitForProgress(result.state, timeouts.waitTimeoutSeconds)
      : result.data?.job ?? result.data;
    const artifacts = result.async
      ? finalJob?.artifacts ?? []
      : result.data?.artifacts ?? [];

    console.log(JSON.stringify({
      ok: true,
      project: projectRoot,
      kind,
      result: result.async ? summarizeProgressState(result.state) : result.data,
      finalJob: result.async ? summarizeProgressState(finalJob) : finalJob,
      artifacts
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: errorMessage(error)
    }, null, 2));
    process.exitCode = 1;
  }
}

async function assertAppReady(healthURL, mcpURL, timeoutMs) {
  if (process.platform !== "darwin") {
    throw new Error("LitSquare Stage native rendering requires macOS in this plugin version.");
  }

  const health = await probe(healthURL, timeoutMs);
  if (!health.ok) {
    throw new Error(`${MANDATORY_MESSAGE} Health check failed: ${health.error ?? health.status}`);
  }

  const mcp = await probe(mcpURL, timeoutMs, true);
  if (!mcp.ok || !Array.isArray(mcp.body?.tools) || !mcp.body.tools.includes("render_video")) {
    throw new Error(`${MANDATORY_MESSAGE} MCP endpoint is not ready.`);
  }
}

async function renderByKind(kind, projectRoot, outputPath) {
  switch (kind) {
    case "frame": {
      await callTool(mcpURL, "load_project", { projectRoot }, timeouts.operationTimeoutMs);
      const data = await callTool(mcpURL, "capture_frame", {
        frame: integerArg(args.frame, 0),
        outputPath,
        overwrite: Boolean(args.overwrite)
      }, timeouts.operationTimeoutMs);
      return { async: false, data };
    }
    case "sequence": {
      const state = await callMCPTool(mcpURL, "litsquare_stage_start_sequence_render", {
        projectRoot,
        startFrame: integerArg(args.startFrame, 0),
        endFrame: integerArg(args.endFrame, 0),
        outputPath,
        overwrite: Boolean(args.overwrite)
      }, timeouts.operationTimeoutMs);
      return { async: true, state };
    }
    case "video": {
      const state = await callMCPTool(mcpURL, "litsquare_stage_start_video_render", {
        projectRoot,
        preset: args.preset ? String(args.preset) : undefined,
        startFrame: integerArg(args.startFrame, 0),
        endFrame: integerArg(args.endFrame, 179),
        outputPath,
        overwrite: Boolean(args.overwrite),
        videoMode: args.videoMode ? String(args.videoMode) : undefined,
        videoOutput: args.videoOutput ? String(args.videoOutput) : undefined
      }, timeouts.operationTimeoutMs);
      return { async: true, state };
    }
    default:
      throw new Error(`Unsupported render kind "${kind}". Use frame, sequence, or video.`);
  }
}

async function waitForProgress(initialState, waitTimeoutSeconds) {
  let state = initialState;
  const jobID = state?.jobID;
  const deadline = Date.now() + waitTimeoutSeconds * 1000;
  while (!isProgressTerminal(state)) {
    if (Date.now() >= deadline) {
      throw new Error(
        `Stopped waiting for LitSquare Stage job ${jobID ?? "unknown"} after ${waitTimeoutSeconds} seconds. The native render was not cancelled.`
      );
    }
    await delay(numberArg(state?.nextRefreshMs, 2000));
    state = await callMCPTool(
      mcpURL,
      "litsquare_stage_render_progress",
      { jobID },
      timeouts.operationTimeoutMs
    );
  }
  if (state.status === "failed" || state.status === "cancelled") {
    const diagnostic = state.diagnostics?.find((item) => item.level === "error");
    throw new Error(diagnostic?.message ?? `LitSquare Stage render ${state.status}.`);
  }
  return state;
}

async function callMCPTool(url, name, argumentsValue, timeoutMs) {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "accept": "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${Date.now()}-${Math.random()}`,
      method: "tools/call",
      params: { name, arguments: removeUndefined(argumentsValue) }
    })
  }, timeoutMs);
  const body = await response.json();
  if (!response.ok || body.error || body.result?.isError) {
    throw new Error(body.error?.message ?? body.result?.content?.[0]?.text ?? `LitSquare Stage MCP tool ${name} failed.`);
  }
  return body.result?.structuredContent ?? body.result;
}

async function callTool(url, tool, payload, timeoutMs) {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, payload: removeUndefined(payload) })
  }, timeoutMs);
  const body = await response.json();
  if (!body.ok) {
    throw new Error(body.error ?? `LitSquare Stage tool ${tool} failed.`);
  }
  return body.data;
}

async function probe(url, timeoutMs, parseJson = false) {
  try {
    const response = await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: parseJson ? JSON.parse(text) : text
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: errorMessage(error)
    };
  }
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
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

function requirePath(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required --${name} path.`);
  }
  return path.resolve(value);
}

function integerArg(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function resolveTimeouts(parsedArgs) {
  const compatibilityTimeout = parsedArgs.timeoutMs ?? parsedArgs.timeout;
  return {
    probeTimeoutMs: numberArg(parsedArgs.probeTimeoutMs ?? compatibilityTimeout, 5000),
    operationTimeoutMs: numberArg(parsedArgs.operationTimeoutMs ?? compatibilityTimeout, 60000),
    waitTimeoutSeconds: numberArg(parsedArgs.waitTimeoutSeconds, 3600)
  };
}

export function isProgressTerminal(state) {
  return state?.terminal === true || ["completed", "failed", "cancelled"].includes(state?.status);
}

export function summarizeProgressState(state) {
  if (!state || typeof state !== "object") {
    return state;
  }
  const summarizePreview = (preview) => {
    if (!preview || typeof preview !== "object") {
      return preview;
    }
    const { dataURL, ...summary } = preview;
    return dataURL ? { ...summary, previewEmbedded: true } : summary;
  };
  return {
    ...state,
    preview: summarizePreview(state.preview),
    previews: Array.isArray(state.previews) ? state.previews.map(summarizePreview) : state.previews
  };
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(milliseconds, 250), 5000)));
}

function printUsage() {
  console.log(`Usage:
  node scripts/render-stage-project.mjs --project <path> --kind video --output /abs/out.mp4 --start-frame 0 --end-frame 179 --overwrite
  node scripts/render-stage-project.mjs --project <path> --kind frame --output /abs/frame.png --frame 42 --overwrite

Timeouts:
  --probe-timeout-ms 5000 --operation-timeout-ms 60000 --wait-timeout-seconds 3600
  --timeout-ms remains a compatibility override for probe and operation requests.

The LitSquare Stage macOS app is mandatory. This script never falls back to Chromium, Playwright, or a remote service.`);
}
