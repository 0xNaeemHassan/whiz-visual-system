# Performance Budgets & Profiling

This project uses lightweight, development-only profiling logs for editor interactions, frame rendering, and asset export.

## Budget thresholds by complexity tier

| Tier | Initial render time | Interaction latency | Export time (PNG/WebP) | JS heap memory |
|---|---:|---:|---:|---:|
| 1 (simple) | <= 100ms | <= 24ms | <= 800ms | <= 180MB |
| 2 (medium) | <= 140ms | <= 32ms | <= 1200ms | <= 260MB |
| 3 (complex) | <= 180ms | <= 45ms | <= 1700ms | <= 340MB |

> Complexity tier maps directly to `frame.tier` in the editor's frame catalog.

## Instrumented paths

- `editor.initial-render`: measured after frame/content updates commit to the preview.
- `editor.interaction.update-content`: measured for content field updates from editor controls.
- `render.whiz-frame`: measured for `WhizFrame` render/commit cycles.
- `export.png` and `export.webp`: measured from export trigger through encoded output generation.

## Log format

In development (`import.meta.env.DEV`), logs are emitted under `[perf]` with:

- `durationMs` or `value`
- `tier`
- `metric`
- `thresholdMs` / `threshold`
- `withinBudget`
- `memoryMb` (when browser `performance.memory` is available)
- contextual metadata (frame id, layout, format, field)

Logs exceeding budgets are emitted with `console.warn`; compliant logs use `console.log`.
