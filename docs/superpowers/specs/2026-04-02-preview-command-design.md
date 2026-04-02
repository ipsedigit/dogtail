# Preview Command Design

**Date:** 2026-04-02

## Goal

A `/preview` slash command that synthesizes the local preview workflow into a single invocation. Eliminates the need to remember the two-step sequence (`build:graph` + `dev`) and handles the conditional logic of whether the dev server is already running.

## Command

`/preview`

Implemented as `.claude/skills/preview/SKILL.md` in the project repository.

## Behavior

1. **Build graph** — always run `npm run build:graph` to ensure `public/graph/` JSON files are in sync with the latest `.md` files in `content/`.
2. **Detect dev server** — check if something is already listening on `localhost:5173`.
3. **Start server if needed** — if not running, launch `npm run dev` in the background and wait until the server is ready.
4. **Open browser** — open `http://localhost:5173` in the default browser using `start`.

## Rationale

- Always rebuilding the graph is safe and fast; skipping it risks stale data.
- Detecting the server avoids killing and restarting a process the user may have running with state.
- Opening the browser is a one-liner on Windows (`start`) and saves a manual step.

## Files

- `.claude/skills/preview/SKILL.md` — the skill definition
