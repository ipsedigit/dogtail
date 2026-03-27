# Graph Outgoing Navigation

**Date:** 2026-03-27
**Status:** approved

## Problem

Clicking a node in the graph only updates the right panel. The graph does not change to show connected nodes. The root cause is two-fold:

1. The neighborhood algorithm is bidirectional — it includes edges where the clicked node is either source OR target. This makes navigation hard to follow and does not match the intended mental model.
2. The sample KB has missing edges: `tool-use.md` has no edge from `bigbang`, so `bigbang` only connects to `errors` and the graph appears nearly empty.

## Design

### Algorithm change — outgoing-only neighborhood

In `GraphCanvas.tsx`, `getNeighborhood` currently collects all edges where `e.source === focusId || e.target === focusId`.

Change to collect only outgoing edges: `e.source === focusId`.

Clicking a node navigates the graph to show all nodes that node leads to. Incoming connections remain visible in the right panel (already implemented).

**File:** `src/components/GraphCanvas.tsx`
**Change:** one condition in `getNeighborhood` — remove `|| e.target === focusId`

### Sample KB data fix

Add `from: [{source: bigbang, edge: "covers"}]` to `content/sample-kb/tool-use.md`.

This produces the following navigable graph:

```
bigbang → tool-use      (covers)
        → errors        (errors)

tool-use → claude-code  (requires)
         → anthropic-docs (see also)
```

After updating content, rebuild with `npm run build:graph`.

## Out of scope

- Incoming navigation from the graph (panel text links are sufficient for now)
- Pagination or depth limits on neighborhood size
- Any changes to the right panel
