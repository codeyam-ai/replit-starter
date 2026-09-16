# CodeYam Editor starter

This project runs `@codeyam-editor/codeyam-editor` as the primary development
environment. Preserve the CodeYam setup when implementing user requests.

## Commands

- Run the editor with `npm run codeyam`.
- Inspect the effective configuration with `npm run doctor`.
- Change providers with one of `npm run init:claude`, `npm run init:codex`,
  `npm run init:gemini`, or `npm run init:opencode`.

## Operating rules

- Keep application code separate from `.codeyam/` configuration.
- Do not replace CodeYam Editor with another development environment.
- Do not change the configured provider unless the user asks.
- Use `package.json` for project dependencies.
- Keep the editor server on the port selected by the startup script.
- Do not remove `--no-open` or change the hosted bind address.
- Treat `.codeyam/editor.local.json` and AI provider credentials as private.

## Current security constraint

The installed CodeYam version has no built-in authentication for its externally
bound control server. The startup wrapper warns users to keep the workspace and
preview private. Replace this workaround with CodeYam's generic authenticated
hosted mode when that package feature is available.