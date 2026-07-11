const elements = {
  connectionLabel: document.getElementById("connection-label"),
  title: document.getElementById("title"),
  summary: document.getElementById("summary"),
  statusPill: document.getElementById("status-pill"),
  statusLabel: document.getElementById("status-label"),
  progressBar: document.getElementById("progress-bar"),
  progressFill: document.getElementById("progress-fill"),
  progressPercent: document.getElementById("progress-percent"),
  frameLabel: document.getElementById("frame-label"),
  etaLabel: document.getElementById("eta-label"),
  previewImage: document.getElementById("preview-image"),
  previewEmpty: document.getElementById("preview-empty"),
  metricFormat: document.getElementById("metric-format"),
  metricResolution: document.getElementById("metric-resolution"),
  metricTiming: document.getElementById("metric-timing"),
  metricBlur: document.getElementById("metric-blur"),
  artifactList: document.getElementById("artifact-list"),
  artifactCount: document.getElementById("artifact-count"),
  eventList: document.getElementById("event-list"),
  eventCount: document.getElementById("event-count"),
  diagnosticList: document.getElementById("diagnostic-list"),
  updatedLabel: document.getElementById("updated-label")
};

const EMPTY_STATE = {
  projectName: "LitSquare Stage Render",
  status: "idle",
  summary: "No active job has been reported yet.",
  frame: 0,
  totalFrames: 0,
  terminal: true,
  artifacts: [],
  events: [],
  diagnostics: []
};

let lastState = EMPTY_STATE;
let lastPreview = null;
let pollTimer = null;

render(readInitialState());

window.addEventListener("message", (event) => {
  const payload = event.data;
  if (!payload || typeof payload !== "object") {
    return;
  }
  if (payload.type !== "litsquare-stage-render-progress") {
    return;
  }
  render(payload.state ?? payload.data ?? payload);
});

window.addEventListener("openai:set_globals", (event) => {
  const state = extractState(event.detail?.globals?.toolOutput);
  if (state) {
    render(state);
  }
});

function readInitialState() {
  const openAIState = extractState(window.openai?.toolOutput);
  if (openAIState) {
    return openAIState;
  }

  const queryState = readQueryState();
  if (queryState) {
    return queryState;
  }

  const embedded = document.getElementById("stage-progress-state");
  if (!embedded?.textContent) {
    return EMPTY_STATE;
  }

  try {
    return JSON.parse(embedded.textContent);
  } catch {
    return EMPTY_STATE;
  }
}

function readQueryState() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("state");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(decodeBase64Url(raw));
  } catch {
    return null;
  }
}

function extractState(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  if (payload.structuredContent && typeof payload.structuredContent === "object") {
    return payload.structuredContent;
  }
  if (payload.toolOutput && typeof payload.toolOutput === "object") {
    return extractState(payload.toolOutput) ?? payload.toolOutput;
  }
  if (payload.result && typeof payload.result === "object") {
    return extractState(payload.result) ?? payload.result;
  }
  if (payload.state && typeof payload.state === "object") {
    return payload.state;
  }
  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  return payload;
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
}

function render(rawState) {
  const state = normalizeState(rawState);
  if (state.preview?.dataURL) {
    lastPreview = state.preview;
  } else if (lastPreview) {
    state.preview = lastPreview;
  }
  lastState = state;

  setText(elements.connectionLabel, state.connectionLabel);
  setText(elements.title, state.projectName);
  setText(elements.summary, state.summary);
  setText(elements.statusLabel, titleCase(state.status));
  elements.statusPill.dataset.status = state.status;

  const progress = clamp(state.progress, 0, 100);
  elements.progressFill.style.width = `${progress}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
  setText(elements.progressPercent, `${formatNumber(progress, 0)}%`);
  setText(elements.frameLabel, frameText(state));
  setText(elements.etaLabel, state.etaLabel);
  renderPreview(state.preview);

  setText(elements.metricFormat, state.formatLabel);
  setText(elements.metricResolution, state.resolutionLabel);
  setText(elements.metricTiming, state.timingLabel);
  setText(elements.metricBlur, state.blurLabel);

  renderArtifacts(state.artifacts);
  renderEvents(state.events);
  renderDiagnostics(state.diagnostics);
  setText(elements.updatedLabel, state.updatedLabel);
  scheduleProgressPoll(state);
}

function normalizeState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const job = objectValue(source.job) ?? objectValue(source.currentJob) ?? source;
  const manifest = objectValue(source.manifest) ?? objectValue(source.project) ?? {};
  const render = objectValue(source.render) ?? {};
  const preview = objectValue(source.preview) ?? {};

  const frame = firstNumber(
    source.frame,
    source.currentFrame,
    job.frame,
    job.currentFrame,
    job.completedFrames
  );
  const totalFrames = firstNumber(
    source.totalFrames,
    source.durationFrames,
    source.frameCount,
    job.totalFrames,
    job.durationFrames,
    job.frameCount,
    manifest.durationFrames,
    preview.durationFrames
  );
  let progress = firstNumber(
    source.progress,
    source.percent,
    job.progress,
    job.percent,
    totalFrames > 0 ? (frame / totalFrames) * 100 : 0
  );
  const progressLooksFraction =
    progress > 0 &&
    progress <= 1 &&
    (source.progress !== undefined || job.progress !== undefined) &&
    source.percent === undefined &&
    job.percent === undefined;
  if (progressLooksFraction) {
    progress *= 100;
  }

  const fps = firstNumber(source.fps, job.fps, manifest.fps, preview.fps);
  const width = firstNumber(source.width, job.width, manifest.width, preview.width);
  const height = firstNumber(source.height, job.height, manifest.height, preview.height);
  const durationSeconds = totalFrames > 0 && fps > 0 ? totalFrames / fps : firstNumber(source.durationSeconds, job.durationSeconds);

  const status = normalizeStatus(String(source.status ?? job.status ?? "idle"));
  const projectName = String(
    source.projectName ??
      source.name ??
      manifest.name ??
      manifest.projectName ??
      job.projectName ??
      "LitSquare Stage Render"
  );
  const outputKind = String(source.kind ?? job.kind ?? job.type ?? source.outputKind ?? "video");
  const outputFormat = String(source.outputFormat ?? job.outputFormat ?? job.videoOutput ?? "h264Mp4");
  const previewFrame = normalizePreview(source.preview ?? job.preview ?? source.latestPreview);
  const terminal = Boolean(
    source.terminal ??
      job.terminal ??
      ["idle", "completed", "complete", "failed", "error", "cancelled"].includes(status)
  );

  return {
    jobID: String(source.jobID ?? job.jobID ?? ""),
    projectName,
    status,
    connectionLabel: String(source.connectionLabel ?? source.server ?? "LitSquare Stage macOS app"),
    summary: summaryText(source, job, status, outputKind),
    progress,
    frame,
    totalFrames,
    etaLabel: etaText(source, job),
    formatLabel: formatLabel(outputKind, outputFormat),
    resolutionLabel: width > 0 && height > 0 ? `${width} x ${height}` : "-",
    timingLabel: fps > 0 && durationSeconds > 0
      ? `${formatNumber(durationSeconds, 1)}s at ${formatNumber(fps, 0)} fps`
      : "-",
    blurLabel: blurLabel(source.motionBlur ?? job.motionBlur ?? render.motionBlur),
    preview: previewFrame,
    artifacts: normalizeList(source.artifacts ?? job.artifacts),
    events: normalizeList(source.events ?? job.events ?? source.recentEvents).slice(-8).reverse(),
    diagnostics: normalizeDiagnostics(source.diagnostics ?? job.diagnostics ?? source.warnings ?? source.errors),
    updatedLabel: updatedLabel(source.updatedAt ?? job.updatedAt ?? Date.now()),
    terminal,
    nextRefreshMs: firstNumber(source.nextRefreshMs, job.nextRefreshMs, 2000)
  };
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return 0;
}

function normalizeStatus(status) {
  return status.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "idle";
}

function summaryText(source, job, status, outputKind) {
  if (typeof source.summary === "string" && source.summary.trim()) {
    return source.summary;
  }
  if (typeof job.message === "string" && job.message.trim()) {
    return job.message;
  }
  if (status === "completed" || status === "complete") {
    return `Finished ${outputKind} render.`;
  }
  if (status === "failed" || status === "error") {
    return "Render failed. Check diagnostics before retrying.";
  }
  if (status === "running" || status === "rendering") {
    return `Rendering ${outputKind}.`;
  }
  if (status === "queued") {
    return "Render job is queued.";
  }
  return "No active job has been reported yet.";
}

function etaText(source, job) {
  const raw = source.eta ?? source.etaLabel ?? job.eta ?? job.etaLabel;
  if (typeof raw === "string" && raw.trim()) {
    return raw;
  }
  const remainingSeconds = firstNumber(source.remainingSeconds, job.remainingSeconds);
  if (remainingSeconds > 0) {
    return `ETA ${formatDuration(remainingSeconds)}`;
  }
  return "ETA unavailable";
}

function frameText(state) {
  if (state.totalFrames <= 0) {
    return "Frame 0 of 0";
  }
  return `Frame ${formatNumber(state.frame, 0)} of ${formatNumber(state.totalFrames, 0)}`;
}

function formatLabel(kind, outputFormat) {
  const kindLabel = titleCase(kind);
  const outputLabel = outputFormat === "h264Mp4" ? "H.264 MP4" : outputFormat;
  return `${kindLabel} / ${outputLabel}`;
}

function blurLabel(rawBlur) {
  const blur = objectValue(rawBlur);
  if (!blur || blur.enabled === false) {
    return "Off";
  }
  const samples = firstNumber(blur.sampleCount, blur.samples);
  const shutter = firstNumber(blur.shutterAngle, blur.shutter);
  if (samples > 0 && shutter > 0) {
    return `${samples} samples / ${shutter} deg`;
  }
  if (samples > 0) {
    return `${samples} samples`;
  }
  return "On";
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => entry && typeof entry === "object");
}

function normalizeDiagnostics(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") {
        return { level: "warning", message: entry };
      }
      if (entry && typeof entry === "object") {
        return entry;
      }
      return null;
    }).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [{ level: "warning", message: value }];
  }
  return [];
}

function normalizePreview(value) {
  const preview = objectValue(value);
  if (!preview || typeof preview.dataURL !== "string" || !preview.dataURL.startsWith("data:image/png;base64,")) {
    return null;
  }
  return {
    dataURL: preview.dataURL,
    frame: preview.frame,
    label: preview.label,
    width: preview.width,
    height: preview.height
  };
}

function renderPreview(preview) {
  if (!elements.previewImage || !elements.previewEmpty) {
    return;
  }
  if (!preview?.dataURL) {
    elements.previewImage.hidden = true;
    elements.previewImage.removeAttribute("src");
    elements.previewEmpty.hidden = false;
    return;
  }
  elements.previewImage.src = preview.dataURL;
  elements.previewImage.hidden = false;
  elements.previewEmpty.hidden = true;
}

function scheduleProgressPoll(state) {
  clearTimeout(pollTimer);
  if (state.terminal || !state.jobID || typeof window.openai?.callTool !== "function") {
    return;
  }
  const delay = clamp(firstNumber(state.nextRefreshMs, 2000), 750, 10000);
  pollTimer = setTimeout(async () => {
    try {
      const response = await window.openai.callTool("litsquare_stage_render_progress", {
        jobID: state.jobID
      });
      const nextState = extractState(response);
      if (nextState) {
        render(nextState);
      } else {
        scheduleProgressPoll(state);
      }
    } catch (error) {
      console.warn("LitSquare Stage progress refresh failed", error);
      scheduleProgressPoll(state);
    }
  }, delay);
}

function renderArtifacts(artifacts) {
  setText(elements.artifactCount, String(artifacts.length));
  replaceList(elements.artifactList, artifacts, "No artifacts yet.", (artifact) => {
    const item = document.createElement("li");
    item.className = "artifact";
    item.append(
      textElement("span", "artifact-name", artifact.name ?? basename(artifact.path) ?? "Artifact"),
      textElement("span", "artifact-meta", artifactMeta(artifact))
    );
    return item;
  });
}

function renderEvents(events) {
  setText(elements.eventCount, String(events.length));
  replaceList(elements.eventList, events, "Waiting for app events.", (event) => {
    const item = document.createElement("li");
    item.className = "event";
    item.append(
      textElement("span", "event-message", event.message ?? event.type ?? "Render event"),
      textElement("span", "event-meta", eventMeta(event))
    );
    return item;
  });
}

function renderDiagnostics(diagnostics) {
  replaceList(elements.diagnosticList, diagnostics, "No warnings or errors.", (diagnostic) => {
    const item = document.createElement("li");
    item.className = "diagnostic";
    item.dataset.level = normalizeStatus(String(diagnostic.level ?? "warning"));
    item.append(
      textElement("span", "diagnostic-message", diagnostic.message ?? diagnostic.error ?? "Diagnostic"),
      textElement("span", "diagnostic-meta", String(diagnostic.source ?? diagnostic.code ?? diagnostic.level ?? "warning"))
    );
    return item;
  });
}

function replaceList(list, rows, emptyText, rowFactory) {
  list.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = emptyText;
    list.append(empty);
    return;
  }
  list.append(...rows.map(rowFactory));
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = String(text);
  return element;
}

function artifactMeta(artifact) {
  const pieces = [];
  if (artifact.path) {
    pieces.push(artifact.path);
  }
  if (artifact.sizeBytes) {
    pieces.push(formatBytes(Number(artifact.sizeBytes)));
  }
  if (artifact.width && artifact.height) {
    pieces.push(`${artifact.width} x ${artifact.height}`);
  }
  return pieces.join(" | ") || "-";
}

function eventMeta(event) {
  const pieces = [];
  if (event.timestamp ?? event.time) {
    pieces.push(updatedLabel(event.timestamp ?? event.time));
  }
  if (event.frame !== undefined) {
    pieces.push(`frame ${event.frame}`);
  }
  if (event.level) {
    pieces.push(String(event.level));
  }
  return pieces.join(" | ") || "-";
}

function basename(path) {
  if (typeof path !== "string" || !path) {
    return null;
  }
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

function setText(element, text) {
  element.textContent = String(text ?? "");
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function formatNumber(value, digits) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${formatNumber(value, value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function updatedLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not updated";
  }
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

window["litsquare-stage-render-progress"] = {
  render,
  getState: () => lastState
};
