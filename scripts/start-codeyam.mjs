import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { childEnv, port, portError, provider, providerError } from "./env.mjs";
import {
  checkEditorInstalled,
  phaseMessage,
  withLocalBin,
} from "./setup-phases.mjs";

for (const error of [providerError(), portError()]) {
  if (error) {
    console.error(error);
    process.exit(1);
  }
}

const env = withLocalBin(childEnv(), process.cwd());

// Run never installs anything: Replit restarts a workflow that installs
// packages, so the editor would never bind. When the install has not happened,
// say which setup phase is missing and how to run it, instead of failing later
// with a bare `spawnSync codeyam-editor ENOENT`.
//
// The same check reports which build is about to run: `--version` prints the
// version and the release channel.
const installed = checkEditorInstalled(process.cwd(), env);
if (!installed.ok) {
  console.error(phaseMessage("install-editor", installed.detail));
  process.exit(1);
}
if (installed.version) console.log(installed.version);

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
    { stdio: "inherit", env },
  );

  if (init.error) {
    console.error(phaseMessage("init", `codeyam-editor init could not run (${init.error.message})`));
    process.exit(1);
  }

  if (init.status !== 0) {
    console.error(phaseMessage("init", `codeyam-editor init exited ${init.status}`));
    process.exit(init.status ?? 1);
  }
}

// Binding non-loopback makes CodeYam require a session token on every
// control-API request (browser: the `cy_session` HTTP-only cookie; everything
// else: `Authorization: Bearer`). That is the default and the starter relies on
// it -- never set CODEYAM_INSECURE_BIND=1 here, which would turn it off.
console.warn(
  [
    "",
    "Starting CodeYam Editor for access through the workspace web preview.",
    "The control API requires a session token on this bind; your browser gets",
    "it automatically. Keep the workspace and its preview private anyway.",
    "",
  ].join("\n"),
);

const editor = spawn(
  "codeyam-editor",
  ["start", "--no-open", "--bind-host", "0.0.0.0", "--port", port],
  { stdio: "inherit", env },
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
