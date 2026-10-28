#!/usr/bin/env node
import { StageMCPClient, probeHealth } from "./stage-mcp-client.mjs";

const DEFAULT_HEALTH_URL = "http://127.0.0.1:7460/healthz";
const DEFAULT_MCP_URL = "http://127.0.0.1:7460/mcp";
const MANDATORY_MESSAGE =
  "The LitSquare Stage native render service is not reachable. Launch or restart the macOS app and retry.";

const args = parseArgs(process.argv.slice(2));
const mcpURL = String(args.mcpUrl ?? process.env.STAGE_MCP_URL ?? DEFAULT_MCP_URL);
const healthURL = String(args.healthUrl ?? process.env.STAGE_HEALTH_URL ?? DEFAULT_HEALTH_URL);
const timeoutMs = numberArg(args.timeoutMs ?? args.timeout, 5000);
const mcpClient = new StageMCPClient({
  url: mcpURL,
  timeoutMs,
  clientName: "litsquare-stage-progress-script"
});

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  await assertAppReady(healthURL, mcpURL, timeoutMs);
  if (args.project) {
    await callTool(mcpURL, "load_project", { projectRoot: String(args.project) }, timeoutMs);
  }

  const state = await readProgressState();
  console.log(JSON.stringify(state, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: errorMessage(error)
  }, null, 2));
  process.exitCode = 1;
}

async function readProgressState() {
  const [status, jobs] = await Promise.all([
    callOptionalTool(mcpURL, "get_project_status", {}, timeoutMs),
    callOptionalTool(mcpURL, "list_render_jobs", {}, timeoutMs)
  ]);
  const job = selectJob(status, jobs, args.jobId);
  const manifest = objectValue(status?.manifest) ?? objectValue(status?.project) ?? {};
  const config = objectValue(manifest.config) ?? manifest;
  const preview = objectValue(config.preview) ?? {};
  const render = objectValue(config.render) ?? objectValue(status?.render) ?? {};
  const diagnostics = diagnosticsFor(job, status);

  const totalFrames = firstNumber(
    job?.totalFrames,
    job?.durationFrames,
    job?.frameCount,
    render.durationFrames,
    preview.durationFrames,
    config.durationFrames
  );
  const frame = firstNumber(job?.frame, job?.currentFrame, job?.completedFrames, status?.frame);
  const fps = firstNumber(job?.fps, render.fps, preview.fps, config.fps);
  const width = firstNumber(job?.width, render.width, preview.width, config.width);
  const height = firstNumber(job?.height, render.height, preview.height, config.height);
  const progress = progressPercent(job, frame, totalFrames);

  return {
    jobID: String(job?.jobID ?? job?.id ?? ""),
    projectName: String(config.name ?? manifest.name ?? manifest.projectName ?? status?.name ?? "LitSquare Stage Render"),
    connectionLabel: "LitSquare Stage macOS app",
    status: String(job?.status ?? status?.status ?? "idle"),
    summary: String(job?.progressMessage ?? job?.message ?? status?.message ?? summaryFor(job)),
    kind: String(job?.kind ?? job?.type ?? "video"),
    outputFormat: String(job?.videoOutput ?? job?.outputFormat ?? render.videoOutput ?? "h264Mp4"),
    frame,
    totalFrames,
    progress,
    fps,
    width,
    height,
    remainingSeconds: firstNumber(job?.remainingSeconds, job?.estimatedRemainingSeconds, job?.etaSeconds),
    motionBlur: job?.motionBlur ?? render.motionBlur ?? { enabled: false },
    artifacts: artifactList(job, status),
    events: compactEvents(status?.events ?? status?.recentEvents ?? job?.events, job),
    diagnostics,
    updatedAt: new Date().toISOString()
  };
}

function selectJob(status, jobs, requestedJobID) {
  const statusJob = objectValue(status?.currentJob) ?? objectValue(status?.job);
  const jobRows = [
    ...normalizeList(jobs?.jobs),
    ...normalizeList(jobs?.queue),
    ...normalizeList(jobs?.recentJobs),
    ...normalizeList(jobs?.recent),
    ...normalizeList(status?.queue?.recent)
  ];
  if (requestedJobID) {
    const requested = jobRows.find((job) => String(job.jobID ?? job.id) === String(requestedJobID));
    if (requested) {
      return requested;
    }
  }
  const activeJob = objectValue(jobs?.currentJob) ?? objectValue(jobs?.active) ?? objectValue(status?.queue?.active);
  if (activeJob) {
    return activeJob;
  }
  if (statusJob && String(statusJob.status ?? "").toLowerCase() !== "idle") {
    return statusJob;
  }
  return jobRows[0] ?? statusJob ?? null;
}

async function assertAppReady(healthURL, mcpURL, timeoutMs) {
  if (process.platform !== "darwin") {
    throw new Error(MANDATORY_MESSAGE);
  }

  const health = await probeHealth(healthURL, timeoutMs);
  if (!health.ok) {
    throw new Error(`${MANDATORY_MESSAGE} Health check failed: ${health.error ?? health.status}`);
  }

  const tools = await mcpClient.listTools();
  if (!Array.isArray(tools?.tools) || !tools.tools.some((tool) => tool?.name === "litsquare_stage_render_progress")) {
    throw new Error(`${MANDATORY_MESSAGE} MCP endpoint is not ready.`);
  }
}

async function callOptionalTool(url, tool, payload, timeoutMs) {
  try {
    return await callTool(url, tool, payload, timeoutMs);
  } catch {
    return null;
  }
}

async function callTool(url, tool, payload, timeoutMs) {
  if (url !== mcpClient.url) {
    throw new Error(`Unexpected MCP endpoint ${url}.`);
  }
  return await mcpClient.callTool(tool, payload, timeoutMs);
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === "object") : [];
}

function normalizeDiagnostics(value) {
  if (!Array.isArray(value)) {
    return typeof value === "string" && value.trim() ? [{ level: "warning", message: value }] : [];
  }
  return value.map((entry) => {
    if (typeof entry === "string") {
      return { level: "warning", message: entry };
    }
    return entry && typeof entry === "object" ? entry : null;
  }).filter(Boolean);
}

function diagnosticsFor(job, status) {
  const jobStatus = String(job?.status ?? "").toLowerCase();
  if (job && jobStatus !== "failed") {
    return [];
  }
  return normalizeDiagnostics(job?.diagnostics ?? status?.diagnostics ?? status?.warnings);
}

function artifactList(job, status) {
  const existing = normalizeList(job?.artifacts ?? status?.artifacts);
  if (existing.length > 0) {
    return existing;
  }
  if (job?.outputPath) {
    return [{
      name: job.kind ? `${job.kind} output` : "Render output",
      path: job.outputPath,
      startFrame: job.startFrame,
      endFrame: job.endFrame,
      frame: job.kind === "frame" ? job.currentFrame : undefined
    }];
  }
  return [];
}

function compactEvents(value, job) {
  const jobID = String(job?.jobID ?? job?.id ?? "");
  if (!jobID) {
    return [];
  }
  return normalizeList(value).filter((event) => {
    const eventJob = objectValue(event.job);
    return String(eventJob?.jobID ?? eventJob?.id ?? "") === jobID;
  }).slice(0, 8).map((event) => {
    const eventJob = objectValue(event.job);
    return {
      timestamp: event.createdAt ?? event.timestamp ?? event.updatedAt,
      type: event.type,
      action: event.action,
      message: event.message ?? eventJob?.progressMessage ?? eventJob?.timingLabel ?? event.action ?? event.type,
      frame: eventJob?.currentFrame,
      status: eventJob?.status,
      progress: eventJob?.progress
    };
  });
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function firstNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return 0;
}

function progressPercent(job, frame, totalFrames) {
  const explicit = firstNumber(job?.progress, job?.percent);
  if (explicit > 0) {
    return explicit <= 1 ? explicit * 100 : explicit;
  }
  return totalFrames > 0 ? (frame / totalFrames) * 100 : 0;
}

function summaryFor(job) {
  if (!job) {
    return "No active job has been reported yet.";
  }
  const status = String(job.status ?? "").toLowerCase();
  if (status === "completed") {
    return "Render completed.";
  }
  if (status === "failed") {
    return "Render failed. Check diagnostics before retrying.";
  }
  if (status === "queued") {
    return "Render job is queued.";
  }
  return "Render job is active.";
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

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function printUsage() {
  console.log(`Usage:
  node scripts/get-render-progress-state.mjs
  node scripts/get-render-progress-state.mjs --project /absolute/project --job-id <jobID>

Outputs the live render-progress state used by the app-served compact widget. The LitSquare Stage macOS app is mandatory.`);
}
