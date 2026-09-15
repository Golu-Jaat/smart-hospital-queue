import { spawn } from "node:child_process";

const baseURL = "http://127.0.0.1:3100";
const server = spawn(process.execPath, ["scripts/e2e-server.mjs"], {
  env: process.env,
  stdio: "inherit",
});

let serverExited = false;
server.once("exit", () => {
  serverExited = true;
});

async function waitForServer() {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (serverExited) throw new Error("E2E server stopped before it was ready");

    try {
      const response = await fetch(baseURL, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.status < 500) return;
    } catch {
      // The production server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Timed out waiting for the E2E server");
}

async function stopServer() {
  if (serverExited) return;

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (!serverExited) server.kill("SIGKILL");
}

let exitCode = 1;

try {
  await waitForServer();
  const tests = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
    { env: process.env, stdio: "inherit" },
  );

  exitCode = await new Promise((resolve) => {
    tests.once("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  await stopServer();
}

process.exit(exitCode);
