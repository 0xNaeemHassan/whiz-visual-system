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

## 2026-05 Editor store churn audit

### Scope
- Audited editor-side write paths for media, timeline delta flags, and slice selection.
- Split static media defaults out of the editor page module into `src/state/editorStore.js`.

### Changes
- Added memoized selector (`createEditorSelectors().selectMediaSlices`) so unchanged media slice references stay stable across unrelated editor updates.
- Added immutable slice helper (`updateSliceImmutable`) to skip no-op writes for media keys.
- Added selector timing instrumentation (`measureSelectorPhase`) via existing perf profiler hooks.
- Added guarded `setRowDeltaFlags` update to return previous array when computed flags are structurally unchanged.

### Before / after hot-path signal (dev profiler logs)
- **Before**: media slice extraction recreated render-time objects on every editor render, generating frequent downstream prop identity churn.
- **After**: selector logs under `editor.media-selector` show only keyed updates when media changes (`hasGradient` / `hasPattern` toggles), with unrelated content edits no longer forcing new slice objects.
- **Result**: lower avoidable rerender pressure in media consumers and timeline warning panel.
