# WhizFrame architecture (lightweight)

## Module responsibilities

- `src/components/WhizFrame.jsx`
  - Thin orchestrator only.
  - Accepts top-level props and delegates rendering to `FrameShell`.
  - May include memoization/perf guards, but **must not** include layout logic, overflow rules, or domain-specific rendering decisions.

- `src/components/whizframe/FrameShell.jsx`
  - Shell/chrome composition only.
  - Owns frame container, ticker, spine, header chrome, selection/edit affordances, overlays, and footer wiring.
  - May call layout orchestration helpers to obtain resolved content/overrides, but should not embed layout-family branching rules.

- `src/components/whizframe/layouts/*`
  - Own all layout-specific branching and rendering behaviors.
  - Own overflow policy, content fitting, and layout heuristics.
  - Shared layout helpers should stay inside `layouts/` unless truly generic.

- `src/components/whizframe/utils/*` (when present)
  - Generic helpers reusable across shell and layouts.
  - Must remain presentation-agnostic and avoid domain side effects.

## Dependency rules

- Allowed direction: `WhizFrame` → `FrameShell` → (`LayoutRegistry`, `layouts/*`, `FrameFooter`, domain tokens/services).
- `layouts/*` must not import from `FrameShell` or `WhizFrame`.
- Keep shared helpers under `layouts/` or `utils/`; do not duplicate helper logic inside `WhizFrame`.
- Avoid circular imports across `FrameShell`, `LayoutRegistry`, `layouts/*`, and `utils/*`.
