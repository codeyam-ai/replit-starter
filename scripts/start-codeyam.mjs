import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const supportedProviders = new Set(["claude", "codex", "gemini", "opencode"]);
const provider = process.env.CODEYAM_PROVIDER || "claude";
const port = process.env.PORT || process.env.CODEYAM_EDITOR_PORT || "4173";

if (!supportedProviders.has(provider)) {
  console.error(
    `Unsupported CODEYAM_PROVIDER "${provider}". ` +
      `Choose one of: ${[...supportedProviders].join(", ")}.`,
  );
  process.exit(1);
}

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error(`Invalid editor port "${port}".`);
  process.exit(1);
}

if (!existsSync(".codeyam/editor.json")) {
  console.log(`Initializing CodeYam Editor with the ${provider} provider...`);
  const init = spawnSync(
    "codeyam-editor",
    ["init", "--provider", provider],
    { stdio: "inherit" },
  );

  if (init.error) {
    console.error(`Unable to initialize CodeYam Editor: ${init.error.message}`);
    process.exit(1);
  }

  if (init.status !== 0) {
    process.exit(init.status ?? 1);
  }
}

console.warn(
  [
    "",
    "Starting CodeYam Editor for access through the workspace web preview.",
    "Keep the workspace and its preview private: this package version does not",
    "yet provide built-in authentication for a non-loopback control server.",
    "",
  ].join("\n"),
);

const editor = spawn(
  "codeyam-editor",
  [
    "start",
    "--no-open",
    "--bind-host",
    "0.0.0.0",
    "--port",
    port,
  ],
  {
    stdio: "inherit",
    env: process.env,
  },
);

editor.on("error", (error) => {
  console.error(`Unable to start CodeYam Editor: ${error.message}`);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!editor.killed) editor.kill(signal);
  });
}

editor.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});