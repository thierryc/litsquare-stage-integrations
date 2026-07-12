import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  appCandidatePaths,
  assessReadiness
} from "../plugins/litsquare-stage-animation/scripts/check-stage-app.mjs";

function healthy(overrides = {}) {
  return {
    isMac: true,
    app: { installed: true },
    health: { ok: true },
    mcp: {
      ok: true,
    server: "litsquare-stage-macos",
      tools: ["load_project", "capture_frame", "render_video"]
    },
    widgetBridge: { ok: true },
    ...overrides
  };
}

test("a healthy native service is authoritative without an installed app path", () => {
  assert.deepEqual(
    assessReadiness(healthy({ app: { installed: false } })),
    { ok: true, failureCode: undefined, message: undefined }
  );
});

test("an installed app with an unreachable service gets launch guidance", () => {
  const result = assessReadiness(healthy({ health: { ok: false } }));
  assert.equal(result.ok, false);
  assert.equal(result.failureCode, "service_unreachable");
  assert.match(result.message, /Launch or restart/);
});

test("unsupported operating systems fail before app discovery", () => {
  const result = assessReadiness(healthy({ isMac: false }));
  assert.equal(result.ok, false);
  assert.equal(result.failureCode, "unsupported_os");
});

test("missing app and service returns installation guidance", () => {
  const result = assessReadiness(healthy({
    app: { installed: false },
    health: { ok: false },
    mcp: { ok: false }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.failureCode, "app_not_found");
  assert.match(result.message, /Install or launch/);
});

test("a foreign or incomplete MCP endpoint is rejected", () => {
  const result = assessReadiness(healthy({
    mcp: { ok: true, server: "other", tools: [] }
  }));
  assert.equal(result.failureCode, "mcp_incompatible");
});

test("an incompatible widget bridge has a distinct failure", () => {
  const result = assessReadiness(healthy({ widgetBridge: { ok: false } }));
  assert.equal(result.failureCode, "widget_bridge_incompatible");
});

test("explicit and environment app paths precede canonical install paths", () => {
  assert.deepEqual(
    appCandidatePaths("/tmp/explicit.app", { STAGE_APP_PATH: "/tmp/environment.app" }, "/tmp/home"),
    [
      "/tmp/explicit.app",
      "/tmp/environment.app",
      "/Applications/LitSquare Stage.app",
      "/tmp/home/Applications/LitSquare Stage.app"
    ]
  );
});

test("render skill makes direct MCP readiness authoritative", async () => {
  const skillPath = fileURLToPath(new URL(
    "../plugins/litsquare-stage-animation/skills/litsquare-stage-render-video/SKILL.md",
    import.meta.url
  ));
  const skill = await readFile(skillPath, "utf8");
  assert.match(skill, /MCP-first preflight/);
  assert.match(skill, /Do not run the shell preflight when the canonical MCP tools are available/);
  assert.match(skill, /Do not tell the user to restart the app based only on that shell failure/);
});


test("render skill requires native final video encoding", async () => {
  const skillPath = fileURLToPath(new URL(
    "../plugins/litsquare-stage-animation/skills/litsquare-stage-render-video/SKILL.md",
    import.meta.url
  ));
  const skill = await readFile(skillPath, "utf8");
  assert.match(skill, /Native Final Video Encoding/);
  assert.match(skill, /Never create a final video by rendering a PNG sequence and passing it to FFmpeg/);
  assert.match(skill, /one native LitSquare Stage video render job per target size/);
  assert.match(skill, /Do not call the sequence tool as an intermediate video-encoding step/);
});
