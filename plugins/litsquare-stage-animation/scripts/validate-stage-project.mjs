#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const project = requirePath(args.project ?? args.projectRoot, "project");
  const report = await validateProject(project);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.errors.length === 0 ? 0 : 1;
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errors: [errorMessage(error)],
    warnings: []
  }, null, 2));
  process.exitCode = 1;
}

async function validateProject(project) {
  const errors = [];
  const warnings = [];
  const files = {
    package: path.join(project, "package.json"),
    config: path.join(project, "stage.config.json"),
    index: path.join(project, "index.html"),
    main: path.join(project, "src", "main.ts"),
    styles: path.join(project, "src", "styles.css")
  };

  for (const [name, filePath] of Object.entries(files)) {
    if (!await exists(filePath)) {
      errors.push(`Missing ${name} file: ${relative(project, filePath)}`);
    }
  }

  const packageJson = await readJSON(files.package, errors, project);
  if (packageJson) {
    if (!packageJson.scripts?.build) errors.push("package.json must define scripts.build.");
    if (!packageJson.scripts?.dev) warnings.push("package.json should define scripts.dev for local preview.");
  }

  const config = await readJSON(files.config, errors, project);
  if (config) validateConfig(config, errors, warnings);

  const index = await readText(files.index);
  if (index && !/id=["']stage["']/.test(index)) {
    errors.push("index.html must include a #stage root.");
  }

  const main = await readText(files.main);
  if (main) validateMain(main, errors, warnings);

  const styles = await readText(files.styles);
  if (styles) validateStyles(styles, warnings);

  if (!await exists(path.join(project, "assets"))) warnings.push("Project should include an assets/ directory.");
  if (!await exists(path.join(project, "data"))) warnings.push("Project should include a data/ directory for snapshots and variants.");

  return {
    ok: errors.length === 0,
    project,
    errors,
    warnings
  };
}

function validateConfig(config, errors, warnings) {
  const preview = config.preview ?? {};
  const render = config.render ?? {};
  for (const key of ["fps", "width", "height", "durationFrames"]) {
    if (!positiveNumber(preview[key])) errors.push(`stage.config.json preview.${key} must be a positive number.`);
  }
  for (const key of ["fps", "width", "height"]) {
    if (!positiveNumber(render[key])) errors.push(`stage.config.json render.${key} must be a positive number.`);
  }
  const blur = render.motionBlur;
  if (!blur || typeof blur !== "object") {
    errors.push("stage.config.json render.motionBlur is required.");
    return;
  }
  if (typeof blur.enabled !== "boolean") errors.push("render.motionBlur.enabled must be boolean.");
  if (!positiveNumber(blur.shutterAngle)) errors.push("render.motionBlur.shutterAngle must be a positive number.");
  if (!Number.isInteger(Number(blur.sampleCount)) || Number(blur.sampleCount) < 1) {
    errors.push("render.motionBlur.sampleCount must be a positive integer.");
  }
  if (blur.enabled && Number(blur.sampleCount) < 4) {
    warnings.push("Enabled motion blur should usually use sampleCount >= 4 for draft or >= 8 for final.");
  }
  if (blur.enabled && Number(blur.shutterAngle) !== 180) {
    warnings.push("Non-180 shutterAngle is valid but should be intentional.");
  }
}

function validateMain(source, errors, warnings) {
  for (const token of ["createRunner", "attachBrowserHost", "attachRenderHost", "renderFrame"]) {
    if (!source.includes(token)) errors.push(`src/main.ts must include ${token}.`);
  }
  if (!source.includes("FrameContext") && !/ctx\.(frame|time|fps|durationFrames)/.test(source)) {
    warnings.push("src/main.ts should derive render-critical state from FrameContext.");
  }
  if (/\bDate\.now\s*\(/.test(source)) errors.push("Date.now() must not be used in export-critical motion.");
  if (/\bperformance\.now\s*\(/.test(source)) errors.push("performance.now() must not be used in export-critical motion.");
  if (/\bMath\.random\s*\(/.test(source) && !/seededRandom|seed/i.test(source)) {
    errors.push("Use seeded randomness instead of unseeded Math.random() in render paths.");
  }
  if (/(new Image|\.decode\(|<img|document\.fonts|@font-face|navigator\.gpu|webgpu|AudioContext|fetch\()/i.test(source) && !source.includes("prepareExport")) {
    warnings.push("Project appears to use async assets, fonts, data, audio, or GPU resources; add prepareExport readiness waits if not already handled elsewhere.");
  }
  if (/fetch\s*\(/.test(source) && /renderFrame[\s\S]*fetch\s*\(/.test(source)) {
    errors.push("Do not fetch live data inside renderFrame; snapshot data before rendering.");
  }
}

function validateStyles(source, warnings) {
  if (!/#stage/.test(source)) {
    warnings.push("styles should define full-frame #stage behavior.");
  }
  if (/transition\s*:|@keyframes/.test(source)) {
    warnings.push("CSS transitions/keyframes are acceptable for previews but final render motion should be frame-driven.");
  }
  if (!/overflow\s*:\s*hidden/.test(source)) {
    warnings.push("Stage styles should prevent scrollbars with overflow: hidden.");
  }
}

async function readJSON(filePath, errors, project) {
  const text = await readText(filePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${relative(project, filePath)} is not valid JSON: ${errorMessage(error)}`);
    return null;
  }
}

async function readText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

function requirePath(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required --${name} path.`);
  }
  return path.resolve(value);
}

function positiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function relative(base, filePath) {
  return path.relative(base, filePath) || ".";
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function printUsage() {
  console.log(`Usage:
  node plugins/litsquare-stage-animation/scripts/validate-stage-project.mjs --project /absolute/project`);
}
