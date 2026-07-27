import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const basePath = "/design-systems-lab";
const nextCli = resolve("node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextCli, "build"], {
  stdio: "inherit",
  env: { ...process.env, PAGES_BASE_PATH: basePath },
});

if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(resolve("out", ".nojekyll"), "");
