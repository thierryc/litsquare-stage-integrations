#!/usr/bin/env node
import { access, copyFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeStageRuntime,
  stagePackageManager,
  stageRuntimePackage,
  stageRuntimeRange
} from "./stage-runtime-release.mjs";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesRoot = path.join(pluginRoot, "templates");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "litsquare-stage-template-sync-"));

try {
  const templates = await templateDirectories();
  for (const template of templates) {
    const workingDirectory = path.join(temporaryRoot, template.name);
    await cp(template.path, workingDirectory, {
      recursive: true,
      filter: shouldCopyTemplateEntry
    });

    const packagePath = path.join(workingDirectory, "package.json");
    const packageJson = normalizeStageRuntime(JSON.parse(await readFile(packagePath, "utf8")));
    await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    await run("pnpm", ["install", "--lockfile-only"], workingDirectory);
    await copyFile(packagePath, path.join(template.path, "package.json"));
    await copyFile(path.join(workingDirectory, "pnpm-lock.yaml"), path.join(template.path, "pnpm-lock.yaml"));
  }

  console.log(JSON.stringify({
    ok: true,
    package: stageRuntimePackage,
    range: stageRuntimeRange,
    packageManager: stagePackageManager,
    templates: templates.map((template) => template.name)
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: errorMessage(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function templateDirectories() {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  const templates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const templatePath = path.join(templatesRoot, entry.name);
    try {
      await access(path.join(templatePath, "package.json"));
      templates.push({ name: entry.name, path: templatePath });
    } catch {
      // Ignore non-project template support directories.
    }
  }
  return templates.sort((left, right) => left.name.localeCompare(right.name));
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

function shouldCopyTemplateEntry(entry) {
  const basename = path.basename(entry);
  return basename !== "node_modules" && basename !== "dist";
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
