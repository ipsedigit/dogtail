# Edge Visibility Fix + Visual Polish

**Date:** 2026-03-28
**Status:** Approved

## Problem

Edges are defined in the graph data and styled in code, but never appear on screen. Root cause: `useEdgesState` in `GraphCanvas.tsx` is initialized with `rawEdges` but `setEdges` is discarded (`const [edges, , onEdgesChange]`). When `visibleIds` expands after a node click, `rawEdges` recomputes via `useMemo`, but without a `setEdges` effect the React Flow edge state never updates. Since the initial render has only the bigbang node visible (no edges qualify), edges remain empty forever.

## Changes

### `src/components/GraphCanvas.tsx`

**Bug fix:**

1. Destructure `setEdges` from `useEdgesState`:
   ```ts
   const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges)
   ```
2. Add an effect to sync edge state when `rawEdges` changes, mirroring the existing `setNodes` pattern:
   ```ts
   useEffect(() => { setEdges(rawEdges) }, [rawEdges, setEdges])
   ```

**Visual polish** (in the `rawEdges` useMemo):

- `style`: add `strokeWidth: 1.5` — default 1px is barely visible
- `labelStyle`: bump `fontSize` from `9` to `11` — readable without cluttering
- `labelBgStyle`: add `borderRadius: 3` and `fillOpacity: 0.85` — label doesn't bleed into the edge line

No new files. No other files touched.

## Out of scope

- Custom edge components
- Edge hover effects
- Edge filtering
