import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const supportedProviders = new Set(["claude", "codex", "gemini", "opencode"]);
// Unset means "let CodeYam decide": the CLI picks its own default today and
// will honour an in-editor provider choice once that lands. The starter only
// forces a provider when the workspace explicitly asks for one.
const provider = process.env.CODEYAM_PROVIDER;
const port = process.env.PORT || process.env.CODEYAM_EDITOR_PORT || "5000";

if (provider !== undefined && !supportedProviders.has(provider)) {
  console.error(
    `Unsupported CODEYAM_PROVIDER "${provider}". ` +
      `Choose one of: ${[...supportedProviders].join(", ")}, ` +
      `or leave it unset to let CodeYam choose.`,
  );
  process.exit(1);
}

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error(`Invalid editor port "${port}".`);
  process.exit(1);
}

// CodeYam installs the selected provider's CLI itself, on first agent session,
// via `npm install -g <package>`. That fails on a Nix-based host like Replit,
// where npm's default global prefix lives in the read-only Nix store. Point the
// prefix at a writable, repo-adjacent dir and put its bin on PATH so the
// install succeeds and the resulting binary is then discoverable.
//
// Deliberately provider-agnostic: this works for whichever CLI CodeYam decides
// to install, so the starter never has to pin one.
const globalPrefix =
  process.env.npm_config_prefix ||
  join(process.env.HOME || homedir(), ".npm-global");
const globalBin = join(globalPrefix, "bin");

mkdirSync(globalBin, { recursive: true });

const childEnv = {
  ...process.env,
  npm_config_prefix: globalPrefix,
  PATH: `${globalBin}${delimiter}${process.env.PATH ?? ""}`,
};

// `codeyam-editor start` only self-initializes an empty folder. This repo ships
// a package.json, so it reads as an existing project and needs an explicit init.
if (!existsSync(".codeyam/editor.json")) {
  console.log(
    provider
      ? `Initializing CodeYam Editor with the ${provider} provider...`
      : "Initializing CodeYam Editor...",
  );
  const init = spawnSync(
    "codeyam-editor",
    provider ? ["init", "--provider", provider] : ["init"],
    { stdio: "inherit", env: childEnv },
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
    env: childEnv,
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
