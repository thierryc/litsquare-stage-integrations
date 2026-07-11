#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const args = parseArgs(process.argv.slice(2));

const widgetPath = path.resolve(String(args.widget ?? path.join(pluginRoot, "assets", "render-progress-widget.html")));
const statePath = path.resolve(String(args.state ?? path.join(pluginRoot, "apps", "render-progress", "sample-state.json")));

try {
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const state = JSON.parse(await readFile(statePath, "utf8"));
  const stateParam = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const url = pathToFileURL(widgetPath);
  url.searchParams.set("state", stateParam);

  console.log(JSON.stringify({
    ok: true,
    widgetPath,
    statePath,
    url: url.href
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
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

function printUsage() {
  console.log(`Usage:
  node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs
  node plugins/litsquare-stage-animation/scripts/make-render-progress-preview-url.mjs --state /tmp/stage-progress.json

Prints a file URL that opens the bundled render progress widget with the provided state.`);
}
