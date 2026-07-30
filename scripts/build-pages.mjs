import { spawnSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const basePath = "/design-systems-lab";
const nextCli = resolve("node_modules", "next", "dist", "bin", "next");
const nextResult = spawnSync(process.execPath, [nextCli, "build"], {
  stdio: "inherit",
  env: { ...process.env, PAGES_BASE_PATH: basePath, NEXT_PUBLIC_PAGES_BASE_PATH: basePath },
});

if (nextResult.status !== 0) process.exit(nextResult.status ?? 1);
writeFileSync(resolve("out", ".nojekyll"), "");

const storybookScript = resolve("scripts", "build-storybook.mjs");
const storybookResult = spawnSync(process.execPath, [storybookScript, resolve("out", "storybook")], {
  stdio: "inherit",
  env: { ...process.env, STORYBOOK_BASE_PATH: `${basePath}/storybook/`, NEXT_PUBLIC_PAGES_BASE_PATH: basePath },
});

if (storybookResult.status !== 0) process.exit(storybookResult.status ?? 1);
copyFileSync(resolve("out", "storybook", "index.html"), resolve("out", "storybook", "404.html"));
