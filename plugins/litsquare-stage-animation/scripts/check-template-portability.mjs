#!/usr/bin/env node
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findNonPortableRuntimeReferences } from "./stage-runtime-release.mjs";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptsRoot = path.join(pluginRoot, "scripts");
const templatesRoot = path.join(pluginRoot, "templates");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "litsquare-stage-template-portability-"));

try {
  const templates = await templateNames();
  const results = [];
  for (const template of templates) {
    const project = path.join(temporaryRoot, template);
    await run(process.execPath, [
      path.join(scriptsRoot, "init-stage-project.mjs"),
      "--template", template,
      "--target", project,
      "--name", `portability-${template}`
    ], pluginRoot);

    const packageText = await readFile(path.join(project, "package.json"), "utf8");
    const lockText = await readFile(path.join(project, "pnpm-lock.yaml"), "utf8");
    const failures = findNonPortableRuntimeReferences(`${packageText}\n${lockText}`);
    if (failures.length > 0) {
      throw new Error(`${template} is not portable: ${failures.join(", ")}`);
    }

    await run("pnpm", ["install", "--frozen-lockfile"], project);
    await run("pnpm", ["build"], project);
    await run(process.execPath, [
      path.join(scriptsRoot, "validate-stage-project.mjs"),
      "--project", project
    ], pluginRoot);
    results.push({ template, ok: true });
  }

  console.log(JSON.stringify({ ok: true, templates: results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: errorMessage(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function templateNames() {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(path.join(templatesRoot, entry.name, "package.json"));
      names.push(entry.name);
    } catch {
      // Ignore non-project template support directories.
    }
  }
  return names.sort();
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${signal ?? `exit ${code}`}`));
    });
  });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
