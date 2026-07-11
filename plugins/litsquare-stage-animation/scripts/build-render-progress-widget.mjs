#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const sourceDir = path.join(pluginRoot, "apps", "render-progress");
const outputPath = path.join(pluginRoot, "assets", "render-progress-widget.html");

const [html, css, js] = await Promise.all([
  readFile(path.join(sourceDir, "index.html"), "utf8"),
  readFile(path.join(sourceDir, "styles.css"), "utf8"),
  readFile(path.join(sourceDir, "progress.js"), "utf8")
]);

const bundled = html
  .replace('<link rel="stylesheet" href="./styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="./progress.js"></script>', `<script>\n${js}\n</script>`);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, bundled, "utf8");

console.log(JSON.stringify({
  ok: true,
  outputPath,
  bytes: Buffer.byteLength(bundled)
}, null, 2));
