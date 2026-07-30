import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";

const storybookCli = resolve("node_modules", "storybook", "dist", "bin", "dispatcher.js");
const outputDir = resolve(process.argv[2] || "storybook-static");
const cacheDir = resolve(tmpdir(), "design-systems-lab-storybook", basename(process.cwd()));
const result = spawnSync(process.execPath, [storybookCli, "build", "--output-dir", outputDir], {
  stdio: "inherit",
  env: { ...process.env, CACHE_DIR: cacheDir },
});

process.exit(result.status ?? 1);
