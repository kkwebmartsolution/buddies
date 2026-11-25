import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
  env: { ...process.env, NITRO_PRESET: "node-server" },
  stdio: "inherit",
  windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
