#!/usr/bin/env node
import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_HEALTH_URL = "http://127.0.0.1:7460/healthz";
const DEFAULT_MCP_URL = "http://127.0.0.1:7460/mcp";
const REQUIRED_MCP_PROTOCOL_VERSION = "2025-06-18";
const PROGRESS_TEMPLATE_URI = "ui://widget/litsquare-stage-render-progress-v2.html";
const PROGRESS_MIME_TYPE = "text/html+skybridge";
const WIDGET_TOOL_NAMES = [
  "litsquare_stage_start_video_render",
  "litsquare_stage_start_sequence_render",
  "litsquare_stage_render_progress"
];
const REQUIRED_RAW_TOOLS = ["load_project", "capture_frame", "render_video"];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const timeoutMs = numberArg(args.probeTimeoutMs ?? args.timeoutMs ?? args.timeout, 5000);
  const healthURL = String(args.healthUrl ?? process.env.STAGE_HEALTH_URL ?? DEFAULT_HEALTH_URL);
  const mcpURL = String(args.mcpUrl ?? process.env.STAGE_MCP_URL ?? DEFAULT_MCP_URL);
  const appPaths = appCandidatePaths(args.appPath);

  const platform = os.platform();
  const isMac = platform === "darwin";
  const app = await findApp(appPaths);
  const health = await probeText(healthURL, timeoutMs);
  const mcp = await probeMCP(mcpURL, timeoutMs);
  const widgetBridge = await probeWidgetBridge(mcpURL, timeoutMs);
  const assessment = assessReadiness({ isMac, app, health, mcp, widgetBridge });
  const warnings = assessment.ok && !app.installed
    ? [{
        code: "debug_app_unregistered",
        message: "The native renderer is healthy, but its app bundle is not registered in a standard Applications folder.",
        action: "For a durable developer setup, register the debug build at ~/Applications/LitSquare Stage.app or pass --app-path."
      }]
    : [];
  const result = {
    ok: assessment.ok,
    failureCode: assessment.failureCode ?? null,
    mandatoryMessage: assessment.message ?? null,
    warnings,
    os: {
      platform,
      type: os.type(),
      release: os.release(),
      isMac
    },
    app,
    endpoints: {
      health,
      mcp
    },
    widgetBridge: {
      ...widgetBridge,
      note: widgetBridge.ok
        ? "JSON-RPC MCP widget bridge is ready for Codex inline render progress."
        : "REST-style /mcp shell status alone cannot mount an inline Codex widget."
    }
  };

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = assessment.ok ? 0 : 2;
}

export function assessReadiness({ isMac, app, health, mcp, widgetBridge }) {
  if (!isMac) {
    return {
      ok: false,
      failureCode: "unsupported_os",
      message: "LitSquare Stage rendering requires macOS in this plugin version."
    };
  }

  if (!health.ok || !mcp.ok) {
    if (app.installed) {
      return {
        ok: false,
        failureCode: "service_unreachable",
        message: "LitSquare Stage is installed, but its local render service is not reachable. Launch or restart the app and retry."
      };
    }
    return {
      ok: false,
      failureCode: "app_not_found",
      message: "The LitSquare Stage app and its local render service were not found. Install or launch the app and retry."
    };
  }

  const rawTools = Array.isArray(mcp.tools) ? mcp.tools : [];
  const missingRawTools = REQUIRED_RAW_TOOLS.filter((name) => !rawTools.includes(name));
  if (mcp.server !== "litsquare-stage-macos" || missingRawTools.length > 0) {
    return {
      ok: false,
      failureCode: "mcp_incompatible",
      message: "The local MCP endpoint is not a compatible LitSquare Stage render service. Update or restart the app and plugin."
    };
  }

  if (!widgetBridge.ok) {
    return {
      ok: false,
      failureCode: "widget_bridge_incompatible",
      message: "LitSquare Stage is running, but its Codex render-progress bridge is incompatible. Update the app and plugin together."
    };
  }

  return { ok: true, failureCode: undefined, message: undefined };
}

export function appCandidatePaths(explicitPath, environment = process.env, homeDirectory = os.homedir()) {
  const paths = [];
  if (explicitPath) {
    paths.push(String(explicitPath));
  }
  if (environment.STAGE_APP_PATH) {
    paths.push(environment.STAGE_APP_PATH);
  }
  paths.push("/Applications/LitSquare Stage.app");
  if (homeDirectory) {
    paths.push(path.join(homeDirectory, "Applications", "LitSquare Stage.app"));
  }
  return [...new Set(paths)];
}

async function findApp(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return {
        installed: true,
        foundPath: candidate,
        checkedPaths: paths
      };
    } catch {
      // Keep checking other candidate locations.
    }
  }
  return {
    installed: false,
    foundPath: null,
    checkedPaths: paths
  };
}

async function probeText(url, timeoutMs) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
    const text = await response.text();
    return {
      ok: response.ok,
      url,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      bodyPreview: text.slice(0, 200)
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      elapsedMs: Date.now() - startedAt,
      error: errorMessage(error)
    };
  }
}

async function probeMCP(url, timeoutMs) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    const tools = Array.isArray(body?.tools) ? body.tools : [];
    return {
      ok: response.ok && body?.ok === true,
      url,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      contentType,
      server: body?.server ?? null,
      tools,
      hasRenderVideo: tools.includes("render_video")
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      elapsedMs: Date.now() - startedAt,
      error: errorMessage(error)
    };
  }
}

async function probeWidgetBridge(url, timeoutMs) {
  const startedAt = Date.now();
  try {
    const [initialize, toolsList, resourceRead] = await Promise.all([
      jsonRPC(url, "initialize", {}, timeoutMs, 1),
      jsonRPC(url, "tools/list", {}, timeoutMs, 2),
      jsonRPC(url, "resources/read", { uri: PROGRESS_TEMPLATE_URI }, timeoutMs, 3)
    ]);
    const tools = Array.isArray(toolsList?.result?.tools) ? toolsList.result.tools : [];
    const toolNames = tools.map((tool) => tool?.name).filter((name) => typeof name === "string");
    const missingTools = WIDGET_TOOL_NAMES.filter((name) => !toolNames.includes(name));
    const progressTool = tools.find((tool) => tool?.name === "litsquare_stage_render_progress");
    const progressMeta = progressTool?._meta ?? {};
    const hasOutputTemplate = progressMeta["openai/outputTemplate"] === PROGRESS_TEMPLATE_URI;
    const hasStandardResourceURI = progressMeta.ui?.resourceUri === PROGRESS_TEMPLATE_URI;
    const widgetAccessible = progressMeta["openai/widgetAccessible"] === true;
    const resourceContents = Array.isArray(resourceRead?.result?.contents) ? resourceRead.result.contents : [];
    const widgetResource = resourceContents.find((content) => content?.uri === PROGRESS_TEMPLATE_URI);
    const resourceMeta = widgetResource?._meta ?? {};
    const hasCompactResourceMeta =
      resourceMeta.ui?.prefersBorder === false &&
      resourceMeta["openai/widgetPrefersBorder"] === false &&
      typeof resourceMeta["openai/widgetDescription"] === "string";
    const resourceReady =
      widgetResource?.mimeType === PROGRESS_MIME_TYPE &&
      typeof widgetResource?.text === "string" &&
      widgetResource.text.includes("window.openai") &&
      widgetResource.text.includes("litsquare_stage_render_progress") &&
      widgetResource.text.includes("notifyIntrinsicHeight") &&
      !widgetResource.text.includes("preview-strip");

    return {
      ok: Boolean(
        initialize?.result?.protocolVersion === REQUIRED_MCP_PROTOCOL_VERSION &&
        missingTools.length === 0 &&
        hasOutputTemplate &&
        hasStandardResourceURI &&
        widgetAccessible &&
        hasCompactResourceMeta &&
        resourceReady
      ),
      url,
      elapsedMs: Date.now() - startedAt,
      protocolVersion: initialize?.result?.protocolVersion ?? null,
      toolNames,
      missingTools,
      progressToolMeta: progressMeta,
      hasOutputTemplate,
      hasStandardResourceURI,
      widgetAccessible,
      hasCompactResourceMeta,
      resource: {
        uri: widgetResource?.uri ?? null,
        mimeType: widgetResource?.mimeType ?? null,
        hasHTML: typeof widgetResource?.text === "string" && widgetResource.text.length > 0
      }
    };
  } catch (error) {
    return {
      ok: false,
      url,
      elapsedMs: Date.now() - startedAt,
      error: errorMessage(error)
    };
  }
}

async function jsonRPC(url, method, params, timeoutMs, id) {
  const requestParams = method === "initialize"
    ? {
        protocolVersion: REQUIRED_MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: "litsquare-stage-codex-preflight",
          title: "LitSquare Stage Codex Preflight",
          version: "0.1.0"
        },
        ...params
      }
    : params;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "accept": "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": REQUIRED_MCP_PROTOCOL_VERSION
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: requestParams
    })
  }, timeoutMs);
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `JSON-RPC ${method} failed with ${response.status}`);
  }
  return body;
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
    const key = toCamel(token.slice(2));
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

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
