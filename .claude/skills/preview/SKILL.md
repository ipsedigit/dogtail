---
name: preview
description: Use when the user wants to preview local changes to the knowledge base or source code. Runs build:graph, starts the dev server if needed, and opens the browser.
---

You are running the local preview workflow for the dogtail project.

Execute the following steps in order using the Bash tool:

## Step 1 — Locate repo root

Run:
```bash
REPO=$(git rev-parse --show-toplevel)
echo $REPO
```

Use the output path as `$REPO` in all subsequent steps. If the command fails, stop and tell the user.

## Step 2 — Build the graph

Run:
```bash
cd "$REPO" && npm run build:graph
```

If the exit code is non-zero, show the full output and stop — do not proceed.

## Step 3 — Check if dev server is running

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

If the output is `200`, the server is already running — skip Step 4.

## Step 4 — Start dev server (if not running)

Run in background:
```bash
cd "$REPO" && npm run dev
```

Then poll until the server is ready:
```bash
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
  [ "$code" = "200" ] && break
  sleep 2
done
[ "$code" != "200" ] && echo "ERROR: dev server did not become ready after 30 seconds" && exit 1
```

## Step 5 — Open browser

Run:
```bash
start http://localhost:5173
```
