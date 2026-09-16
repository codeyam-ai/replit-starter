# CodeYam Editor on Replit

This starter runs
[`@codeyam-editor/codeyam-editor`](https://www.npmjs.com/package/@codeyam-editor/codeyam-editor)
in a browser-accessible Replit workspace.

## Check the workspace

```bash
npm run setup
```

Verifies Node, reports the effective port and provider, initializes
`.codeyam/editor.json` if it is missing, and runs CodeYam's health checks.
It is advisory: it reports and exits 0, so warnings on a fresh workspace (no
scenarios yet, no dev server running) do not look like failures.

Running it is optional — `npm run codeyam` initializes what it needs on its
own. It exists so setup state is inspectable without starting the editor.

It deliberately makes no git commits. If health reports the agent surface is
out of sync, repair it explicitly with:

```bash
npx codeyam-editor editor install-hooks
```

That command creates a commit, which is why `npm run setup` does not run it
for you.

## Start the editor

1. Create a private Replit project from this repository.
2. Click **Run**. The `CodeYam Editor` workflow installs dependencies, runs
   `npm run codeyam`, and waits for port `5000`.
3. Open the web preview.

The first run initializes CodeYam and lets you pick an AI coding provider. To
pin a provider ahead of that first run instead, set `CODEYAM_PROVIDER` to
`claude`, `codex`, `gemini`, or `opencode`.

## AI provider required

CodeYam orchestrates an AI coding CLI; it does not include an AI model or
provider subscription. The supported CLIs are:

- Claude Code
- Codex
- Gemini
- OpenCode

You do not need to install these yourself, and this starter deliberately does
not depend on any of them. CodeYam installs the CLI for the selected provider
on demand, the first time an agent session starts, with `npm install -g`. The
startup wrapper points npm's global prefix at `~/.npm-global` and adds it to
`PATH`, because npm's default global prefix is inside Replit's read-only Nix
store and an install there would fail.

You do still need to authenticate. The credentials belong to the selected
provider. Store API keys and tokens in Replit Secrets, never in source files.

To switch an initialized project explicitly, run one of:

```bash
npm run init:claude
npm run init:codex
npm run init:gemini
npm run init:opencode
```

## Configuration

The startup wrapper uses:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CODEYAM_PROVIDER` | unset | Pins the provider used during first initialization |
| `npm_config_prefix` | `~/.npm-global` | Writable prefix for provider CLI installs |
| `PORT` | `5000` | Editor port assigned by the hosted environment |
| `CODEYAM_EDITOR_PORT` | `5000` | Fallback when `PORT` is not set |

The editor uses port `5000`, the port Replit forwards to the web preview. It
does not collide with CodeYam's default application port, `3000`.

Leaving `CODEYAM_PROVIDER` unset is the intended path: CodeYam chooses the
provider itself, so the starter does not have to hardcode one. Provider
selection is only applied when `.codeyam/editor.json` does not yet exist, which
prevents a restart from unexpectedly rewriting an existing project's setup.

The editor launcher intentionally is not named `dev` or `start`. CodeYam uses
those conventional package scripts to detect the application command, so using
one of them for the editor itself could create a recursive startup.

## Security status

CodeYam `0.1.10` requires the server to bind to `0.0.0.0` for a hosted web
preview, but it does not yet provide built-in authentication for that mode.
Keep both the Replit project and its development preview private.

Do not deploy the current starter as a public application. The startup wrapper
will be simplified once CodeYam provides generic authenticated support for
hosted browser-based development environments.

## Updating CodeYam

The dependency is pinned intentionally so new projects remain reproducible.
Test a new release in a fresh workspace before changing the version in
`package.json`.