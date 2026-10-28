export const stageRuntimePackage = "@litsquare/stage";
export const stageRuntimeRange = "^0.1.1";
export const stagePackageManager = "pnpm@10.29.2";
export const obsoleteStageRuntimePackages = ["@litsquare/litstage"];

export function normalizeStageRuntime(packageJson) {
  const dependencies = { ...packageJson.dependencies };
  for (const packageName of obsoleteStageRuntimePackages) {
    delete dependencies[packageName];
  }
  dependencies[stageRuntimePackage] = stageRuntimeRange;

  return {
    ...packageJson,
    packageManager: stagePackageManager,
    dependencies
  };
}

export function findNonPortableRuntimeReferences(text) {
  const failures = [];
  if (text.includes("@litsquare/litstage")) failures.push("obsolete @litsquare/litstage package name");
  if (/\bfile:/.test(text)) failures.push("local file dependency");
  if (/workspace:/.test(text)) failures.push("workspace dependency");
  if (/(?:\/Users\/|\/home\/|\/private\/var\/|[A-Za-z]:\\\\)/.test(text)) failures.push("absolute filesystem path");
  return failures;
}
