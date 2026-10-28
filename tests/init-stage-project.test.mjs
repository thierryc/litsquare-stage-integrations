import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import {
  findNonPortableRuntimeReferences,
  stagePackageManager,
  stageRuntimePackage,
  stageRuntimeRange
} from "../plugins/litsquare-stage-animation/scripts/stage-runtime-release.mjs";

const execute = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const initializer = path.join(repositoryRoot, "plugins/litsquare-stage-animation/scripts/init-stage-project.mjs");
const validator = path.join(repositoryRoot, "plugins/litsquare-stage-animation/scripts/validate-stage-project.mjs");
const templatesRoot = path.join(repositoryRoot, "plugins/litsquare-stage-animation/templates");

test("initializer creates a registry-portable Stage project", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "litsquare-stage-init-test-"));
  const project = path.join(temporaryRoot, "project");
  try {
    const { stdout } = await execute(process.execPath, [
      initializer,
      "--template", "basic-slideshow",
      "--target", project,
      "--name", "Portable Project"
    ], { cwd: repositoryRoot });
    const output = JSON.parse(stdout);
    const packageJson = JSON.parse(await readFile(path.join(project, "package.json"), "utf8"));

    assert.equal(output.ok, true);
    assert.equal(output.packageManager, stagePackageManager);
    assert.deepEqual(output.commands.slice(0, 2), [
      "pnpm install --frozen-lockfile",
      "pnpm build"
    ]);
    assert.equal(packageJson.packageManager, stagePackageManager);
    assert.equal(packageJson.dependencies[stageRuntimePackage], stageRuntimeRange);
    assert.equal(packageJson.dependencies["@litsquare/litstage"], undefined);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("portability scan rejects local and obsolete runtime references", () => {
  assert.deepEqual(findNonPortableRuntimeReferences("@litsquare/stage: ^0.1.0"), []);
  assert.deepEqual(
    findNonPortableRuntimeReferences("@litsquare/litstage: file:../../packages/litstage"),
    ["obsolete @litsquare/litstage package name", "local file dependency"]
  );
  assert.deepEqual(
    findNonPortableRuntimeReferences("@litsquare/stage: workspace:*"),
    ["workspace dependency"]
  );
  assert.deepEqual(
    findNonPortableRuntimeReferences("resolution: /Users/developer/litsquare-stage"),
    ["absolute filesystem path"]
  );
});

test("all bundled templates use the supported registry runtime and portable lockfiles", async () => {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  let templateCount = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packagePath = path.join(templatesRoot, entry.name, "package.json");
    try {
      await access(packagePath);
    } catch {
      continue;
    }

    templateCount += 1;
    const packageText = await readFile(packagePath, "utf8");
    const lockText = await readFile(path.join(templatesRoot, entry.name, "pnpm-lock.yaml"), "utf8");
    const packageJson = JSON.parse(packageText);
    assert.equal(packageJson.packageManager, stagePackageManager, entry.name);
    assert.equal(packageJson.dependencies[stageRuntimePackage], stageRuntimeRange, entry.name);
    assert.deepEqual(findNonPortableRuntimeReferences(`${packageText}\n${lockText}`), [], entry.name);
    assert.match(lockText, /'@litsquare\/stage'/, entry.name);
  }
  assert.equal(templateCount, 8);
});

test("project validation warns when audio code is configured to render silently", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "litsquare-stage-audio-preflight-"));
  const project = path.join(temporaryRoot, "project");
  try {
    await cp(path.join(templatesRoot, "basic-slideshow"), project, { recursive: true });
    const mainPath = path.join(project, "src", "main.ts");
    const main = await readFile(mainPath, "utf8");
    await writeFile(mainPath, `${main}\nconst cueURL = "file:///tmp/cue.wav";\nconst cueRequest = new XMLHttpRequest();\nif (cueRequest.status !== 200) throw new Error(cueURL);\n`);

    const { stdout } = await execute(process.execPath, [validator, "--project", project], {
      cwd: repositoryRoot
    });
    const report = JSON.parse(stdout);
    assert.equal(report.ok, true);
    assert.ok(report.warnings.some((warning) => warning.includes("audioEnabled is not true")));
    assert.ok(report.warnings.some((warning) => warning.includes("status 0")));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("project validation accepts guarded non-empty local status zero audio loads", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "litsquare-stage-local-audio-"));
  const project = path.join(temporaryRoot, "project");
  try {
    await cp(path.join(templatesRoot, "basic-slideshow"), project, { recursive: true });
    const configPath = path.join(project, "stage.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.render.audioEnabled = true;
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const mainPath = path.join(project, "src", "main.ts");
    const main = await readFile(mainPath, "utf8");
    await writeFile(mainPath, `${main}\nconst cueURL = new URL("file:///tmp/cue.wav");\nconst cueRequest = new XMLHttpRequest();\nconst cueLoaded = cueRequest.status === 200 || (cueURL.protocol === "file:" && cueRequest.status === 0 && cueRequest.response.byteLength > 0);\nif (!cueLoaded) throw new Error("cue failed");\n`);

    const { stdout } = await execute(process.execPath, [validator, "--project", project], {
      cwd: repositoryRoot
    });
    const report = JSON.parse(stdout);
    assert.equal(report.ok, true);
    assert.ok(!report.warnings.some((warning) => warning.includes("status 0")));
    assert.ok(!report.warnings.some((warning) => warning.includes("audioEnabled is not true")));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
