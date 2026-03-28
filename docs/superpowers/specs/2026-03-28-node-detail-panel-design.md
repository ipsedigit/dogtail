# Node Detail — Expanded Panel, Minimal Clean

**Date:** 2026-03-28
**Status:** Approved

## Goal

When clicking a node, the right panel expands and displays the node's full markdown content with clean, readable typography. No modal, no drawer — the existing panel grows in place.

## Panel Expansion

- When `selectedNode` is non-null, panel width is `380px`; when null, `240px`
- Change is applied via a conditional `width` style on `.panel` in `Panel.tsx`
- No CSS transition — instant snap
- The graph canvas fills remaining space automatically via the existing `flex: 1` / `overflow: hidden` flexbox layout on `.graph-body`

## NodeDetail Visual Design

`NodeDetail` in `Panel.tsx` is restyled. `Panel` receives a new `nodeColors` prop so `NodeDetail` can use the type color for the accent line.

### Header

- **Type label** — `9px`, uppercase, `var(--text-dim)` (unchanged)
- **Title** — `18px`, `font-weight: 700`, `var(--text)`
- **Accent line** — `1px` div, `linear-gradient(to right, <typeColor>, transparent)`, sits directly under the title, `margin-bottom: 10px`
- **Overview** — `11px`, italic, `var(--text-muted)`

### Markdown body

- `font-size: 12px`, `line-height: 1.8`, color `var(--text)` (brighter than current muted)
- `h1/h2/h3` — `13px`, `var(--text)`, `margin: 12px 0 4px`
- `code` (inline) — `background: var(--surface)`, `padding: 1px 4px`, `border-radius: 3px`
- `pre` / `code` (block) — `background: var(--surface)`, `border: 1px solid var(--border-dim)`, `padding: 10px`, `border-radius: 4px`, `overflow-x: auto`
- `ul/ol` — `padding-left: 16px`, `margin-bottom: 8px`
- `p` — `margin-bottom: 10px`

### Connections

- Unchanged structure (`← label source` / `→ label target`)
- Edge label text colored with `edgeColors[e.type]` (was plain `var(--text-muted)`)

## Files Changed

| File | Change |
|------|--------|
| `src/components/Panel.tsx` | Add `nodeColors` prop, conditional panel width, restyle `NodeDetail` |
| `src/styles/app.css` | Update `.panel` width logic, update `.panel-content` typography rules, add `.panel-accent-line` |
| `src/pages/GraphPage.tsx` | Pass `nodeColors` to `Panel` |

## Out of Scope

- Animated panel width transition
- Tabs or sections within the panel
- Scroll position memory
