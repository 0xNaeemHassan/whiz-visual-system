# Performance Backlog

This backlog tracks known or suspected performance hotspots against the measurable budgets defined in `docs/performance.md`.

## Hotspots

| ID | Hotspot | Reproduction steps | Metric (from `docs/performance.md`) | Acceptance threshold | Owner | Severity | Target release |
|---|---|---|---|---|---|---|---|
| PERF-001 | Slow preview update on first frame load for complex templates | 1) Run app in dev mode. 2) Select a tier-3 frame from the frame catalog. 3) Trigger an initial render by switching between frames with large content payloads. 4) Inspect `[perf] editor.initial-render` logs and capture `durationMs`. | `editor.initial-render` (`durationMs`, tier-aware budget) | Tier 3 initial render time `<= 180ms` | Editor Rendering Team | High | v0.9.0 |
| PERF-002 | Typing lag in content controls on medium/complex frames | 1) Open a tier-2 or tier-3 frame. 2) Rapidly edit multiple text fields (headline, subhead, CTA) for 10-15 seconds. 3) Inspect `[perf] editor.interaction.update-content` logs for p95 `durationMs`. | `editor.interaction.update-content` (`durationMs`, tier-aware budget) | Tier 2 interaction latency `<= 32ms`; Tier 3 interaction latency `<= 45ms` | Editor Controls Team | High | v0.9.0 |
| PERF-003 | Re-render churn in `WhizFrame` commit cycle during batched updates | 1) Open any frame and apply 5+ style/content updates in quick succession. 2) Record `[perf] render.whiz-frame` logs while updates are in flight. 3) Compare peak and p95 `durationMs` by tier. | `render.whiz-frame` (`durationMs`, tier-aware budget) | Tier 1 `<= 24ms`; Tier 2 `<= 32ms`; Tier 3 `<= 45ms` | Runtime/UI Platform | Medium | v0.10.0 |
| PERF-004 | Export time spikes for high-resolution assets | 1) Load a tier-3 frame with dense imagery. 2) Export PNG and WebP three times each. 3) Inspect `[perf] export.png` and `[perf] export.webp` logs and average `durationMs`. | `export.png`, `export.webp` (`durationMs`, tier-aware budget) | Tier 3 export time `<= 1700ms` | Export Pipeline Team | Medium | v0.10.0 |
| PERF-005 | Elevated JS heap usage after repeated edit/export loops | 1) In Chrome devtools, perform 20 cycles of: edit content -> preview -> export. 2) Inspect `[perf]` logs where `memoryMb` is available. 3) Compare post-loop memory with tier budget. | JS heap memory (`memoryMb` / `value`, tier-aware budget) | Tier 3 JS heap memory `<= 340MB` (Tier 2 `<= 260MB`, Tier 1 `<= 180MB`) | Performance Working Group | High | v0.9.0 |

## Triage notes

- Severity rubric: **High** = blocks smooth authoring or risks failed exports; **Medium** = noticeable degradation but usable with workarounds.
- Owners are functional placeholders and should map to the team aliases used in sprint planning.
- Each backlog item should be closed only after profiling evidence shows sustained compliance with the linked acceptance threshold.
