# CodeYam Editor on Replit

This starter runs
[`@codeyam-editor/codeyam-editor`](https://www.npmjs.com/package/@codeyam-editor/codeyam-editor)
in a browser-accessible Replit workspace.

## Start the editor

1. Create a private Replit project from this repository.
2. Install the project dependencies.
3. Click **Run**. Replit invokes `npm run codeyam`.
4. Open the web preview.

The first run initializes CodeYam with Claude as the default AI coding
provider. To choose another supported provider before the first run, set
`CODEYAM_PROVIDER` to `codex`, `gemini`, or `opencode`.

## AI provider required

CodeYam orchestrates an AI coding CLI; it does not include an AI model or
provider subscription. Install and authenticate one of these supported CLIs in
the workspace:

- Claude Code
- Codex
- Gemini
- OpenCode

The credentials belong to the selected provider. Store API keys and tokens in
Replit Secrets, never in source files.

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
| `CODEYAM_PROVIDER` | `claude` | Provider used during first initialization |
| `PORT` | `4173` | Editor port assigned by the hosted environment |
| `CODEYAM_EDITOR_PORT` | `4173` | Fallback when `PORT` is not set |

The editor uses port `4173` by default so it does not collide with CodeYam's
default application port, `3000`.

Provider selection is only applied when `.codeyam/editor.json` does not yet
exist. This prevents a restart from unexpectedly rewriting an existing
project's provider setup.

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