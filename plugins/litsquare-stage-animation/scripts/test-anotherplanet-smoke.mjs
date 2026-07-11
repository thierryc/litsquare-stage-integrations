#!/usr/bin/env node
import { mkdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(pluginRoot, "../../..");
const defaultProject = path.join(workspaceRoot, "stages", "anotherplanet-cube-litsquare-stage");
const defaultOutputDir = path.join(os.tmpdir(), "stage-anotherplanet-smoke");

const args = parseArgs(process.argv.slice(2));
const projectRoot = path.resolve(String(args.project ?? defaultProject));
const outputDir = path.resolve(String(args.outputDir ?? defaultOutputDir));
const startFrame = integerArg(args.startFrame, 0);
const endFrame = integerArg(args.endFrame, 119);
const stillFrame = integerArg(args.frame, 60);
const timeoutMs = integerArg(args.timeoutMs ?? args.timeout, 300000);
const appPath = args.appPath ? path.resolve(String(args.appPath)) : process.env.STAGE_APP_PATH;
const skipBuild = Boolean(args.skipBuild);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const stillPath = path.join(outputDir, `anotherplanet-frame-${stillFrame}-${timestamp}.png`);
const videoPath = path.join(outputDir, `anotherplanet-smoke-${startFrame}-${endFrame}-${timestamp}.mp4`);

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  await mkdir(outputDir, { recursive: true });
  const steps = [];

  steps.push(await runNode("check-stage-app.mjs", [
    ...(appPath ? ["--app-path", appPath] : []),
    "--timeout-ms", String(Math.min(timeoutMs, 30000))
  ]));
  if (!skipBuild) {
    steps.push(await runCommand("pnpm", ["build"], { cwd: projectRoot }));
  }
  steps.push(await runNode("render-stage-project.mjs", [
    "--project", projectRoot,
    "--kind", "frame",
    "--output", stillPath,
    "--frame", String(stillFrame),
    "--overwrite",
    "--timeout-ms", String(timeoutMs)
  ]));
  steps.push(await runNode("render-stage-project.mjs", [
    "--project", projectRoot,
    "--kind", "video",
    "--output", videoPath,
    "--start-frame", String(startFrame),
    "--end-frame", String(endFrame),
    "--overwrite",
    "--timeout-ms", String(timeoutMs),
    "--wait-timeout-seconds", String(Math.ceil(timeoutMs / 1000))
  ]));

  const artifacts = await Promise.all([artifactInfo(stillPath), artifactInfo(videoPath)]);
  console.log(JSON.stringify({
    ok: true,
    projectRoot,
    outputDir,
    frameRange: { startFrame, endFrame, stillFrame },
    artifacts,
    steps
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    projectRoot,
    outputDir,
    error: errorMessage(error)
  }, null, 2));
  process.exitCode = 1;
}

async function runNode(scriptName, extraArgs) {
  return runCommand(process.execPath, [path.join(scriptDir, scriptName), ...extraArgs], { cwd: workspaceRoot });
}

async function runCommand(command, commandArgs, options) {
  const startedAt = Date.now();
  const child = spawn(command, commandArgs, {
    cwd: options.cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  const step = {
    command,
    args: commandArgs,
    cwd: options.cwd,
    exitCode,
    elapsedMs: Date.now() - startedAt,
    stdout: stdout.trim().slice(-4000),
    stderr: stderr.trim().slice(-4000)
  };
  if (exitCode !== 0) {
    throw new Error(`Step failed: ${command} ${commandArgs.join(" ")}\n${step.stderr || step.stdout}`);
  }
  return step;
}

async function artifactInfo(filePath) {
  const metadata = await stat(filePath);
  return {
    path: filePath,
    sizeBytes: metadata.size
  };
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

function integerArg(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function printUsage() {
  console.log(`Usage:
  node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs
  node plugins/litsquare-stage-animation/scripts/test-anotherplanet-smoke.mjs --app-path /Applications/LitSquare Stage.app --output-dir /tmp/stage-out --start-frame 0 --end-frame 59 --frame 30 --timeout-ms 300000

The LitSquare Stage macOS app endpoint is mandatory. This smoke test does not fall back to Chromium or Playwright.`);
}
