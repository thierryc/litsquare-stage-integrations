import assert from "node:assert/strict";
import test from "node:test";

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
