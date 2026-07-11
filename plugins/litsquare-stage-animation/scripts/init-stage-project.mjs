#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesRoot = path.join(pluginRoot, "templates");
const args = parseArgs(process.argv.slice(2));

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const template = String(args.template ?? "basic-slideshow");
  const target = requirePath(args.target ?? args.project ?? args.output, "target");
  const source = path.join(templatesRoot, template);
  const overwrite = Boolean(args.overwrite);

  await assertExists(source, `Unknown template "${template}".`);
  if (!overwrite && await exists(target)) {
    throw new Error(`Target already exists: ${target}. Pass --overwrite to replace or choose another target.`);
  }

  await cp(source, target, {
    recursive: true,
    force: overwrite,
    errorOnExist: !overwrite,
    filter: shouldCopyTemplateEntry
  });

  await mkdir(path.join(target, "assets"), { recursive: true });
  await mkdir(path.join(target, "data"), { recursive: true });
  await normalizePackage(target, args.name ?? path.basename(target));
  await normalizeConfig(target, args);

  console.log(JSON.stringify({
    ok: true,
    project: target,
    template,
    next: `node ${path.join(pluginRoot, "scripts", "validate-stage-project.mjs")} --project ${target}`
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: errorMessage(error)
  }, null, 2));
  process.exitCode = 1;
}

async function normalizePackage(target, name) {
  const packagePath = path.join(target, "package.json");
  const json = JSON.parse(await readFile(packagePath, "utf8"));
  json.name = packageName(name);
  json.private = true;
  json.type = "module";
  json.scripts = {
    build: json.scripts?.build ?? "vite build",
    dev: json.scripts?.dev ?? "vite --host 127.0.0.1",
    ...json.scripts
  };
  await writeFile(packagePath, `${JSON.stringify(json, null, 2)}\n`);
}

async function normalizeConfig(target, args) {
  const configPath = path.join(target, "stage.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const width = integerArg(args.width, config.preview?.width ?? 1920);
  const height = integerArg(args.height, config.preview?.height ?? 1080);
  const fps = integerArg(args.fps, config.preview?.fps ?? 30);
  const durationFrames = integerArg(args.durationFrames ?? args.frames, config.preview?.durationFrames ?? 180);
  const finalBlur = booleanArg(args.finalBlur ?? args.motionBlur, false);

  config.name = String(args.title ?? config.name ?? "LitSquare Stage Video");
  config.sourceEntry = config.sourceEntry ?? "index.html";
  config.buildDir = config.buildDir ?? "dist";
  config.preview = {
    ...config.preview,
    fps,
    width,
    height,
    durationFrames,
    loop: booleanArg(args.loop, config.preview?.loop ?? true)
  };
  config.render = {
    ...config.render,
    width: integerArg(args.renderWidth, width),
    height: integerArg(args.renderHeight, height),
    fps,
    audioEnabled: Boolean(config.render?.audioEnabled ?? false),
    videoOutput: config.render?.videoOutput ?? "h264Mp4",
    videoMode: config.render?.videoMode ?? "deterministic",
    motionBlur: {
      enabled: finalBlur,
      shutterAngle: integerArg(args.shutterAngle, config.render?.motionBlur?.shutterAngle ?? 180),
      sampleCount: integerArg(args.sampleCount, finalBlur ? 8 : 1)
    },
    snapshotWaitMs: integerArg(args.snapshotWaitMs, config.render?.snapshotWaitMs ?? 0),
    maxWorkerCount: integerArg(args.maxWorkerCount, config.render?.maxWorkerCount ?? 2)
  };

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
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

function packageName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "litsquare-stage-video";
}

function integerArg(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function booleanArg(value, fallback) {
  if (value === undefined) return fallback;
  if (value === true || value === false) return value;
  if (String(value).toLowerCase() === "false") return false;
  if (String(value).toLowerCase() === "0") return false;
  return true;
}

function shouldCopyTemplateEntry(entry) {
  const basename = path.basename(entry);
  return basename !== "node_modules" && basename !== "dist";
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assertExists(filePath, message) {
  if (!await exists(filePath)) {
    throw new Error(message);
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function printUsage() {
  console.log(`Usage:
  node plugins/litsquare-stage-animation/scripts/init-stage-project.mjs --template basic-slideshow --target /absolute/project --name my-video

Options:
  --width 1920 --height 1080 --fps 30 --frames 180
  --final-blur --sample-count 8 --shutter-angle 180
  --overwrite`);
}
