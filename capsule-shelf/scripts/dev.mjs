import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const apiEntrypoint = resolve(projectRoot, "server/inventoryApi.mjs");
const viteEntrypoint = resolve(projectRoot, "node_modules/vite/bin/vite.js");
const children = [
  spawn(process.execPath, [apiEntrypoint], { cwd: projectRoot, stdio: "inherit" }),
  spawn(process.execPath, [viteEntrypoint, ...process.argv.slice(2)], { cwd: projectRoot, stdio: "inherit" }),
];
let shuttingDown = false;

function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

for (const child of children) {
  child.once("error", (error) => {
    process.stderr.write(`Could not start development process: ${error.message}\n`);
    shutdown("SIGTERM", 1);
  });
  child.once("exit", (code) => {
    if (!shuttingDown) shutdown("SIGTERM", code ?? 1);
  });
}
