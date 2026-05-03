# Whiz Visual System — Power-User Audit & Remediation Plan

## Scope
- Product-level audit across: frame architecture, visual system fidelity, editor UX, data integrity, accessibility, performance, maintainability, QA, and release operations.
- Inputs: live codebase, current frame implementation, and your target visual + 50-frame operating model.

## Executive Summary
The system already has a strong conceptual base and broad layout support, but quality is currently bottlenecked by **consistency drift**, **editor complexity**, **data/source trust gaps**, and **operational guardrails that are not encoded in product logic**.

Top 10 priorities:
1. Enforce non-negotiables in product logic (1 theme color, 3 fonts, quantized type scale, frame immutability).
2. Break `WhizFrame.jsx` into modular layout renderers + schema-based contracts.
3. Fix content model duplication/collision and add deterministic migrations.
4. Add hard validation for numbers/sources before publish/export.
5. Build frame-level accessibility (contrast, semantics, keyboard support).
6. Add visual regression tests for all 50 frame archetypes.
7. Create editor “guided mode” for fast, error-proof production.
8. Improve mobile usability and reduce dense side-panel friction.
9. Add performance budgets + instrumentation for export/render lag.
10. Introduce release checklists, bug taxonomy, and incident playbooks.

---

## A. System Architecture & Code Health

1. `WhizFrame.jsx` is a monolith with too many responsibilities (layout routing, style logic, heuristics, rendering, and micro-utilities).
2. Switch-based layout routing is brittle and easy to break during additions.
3. Layout components do not appear to be schema-enforced (missing/extra fields can silently degrade output).
4. Missing strict type contracts (TypeScript or runtime zod schemas) for frame content and overrides.
5. Editor default data object contains duplicate keys (`tableRows`, `tableHeaders`) that can hide subtle bugs.
6. Default content mixes multiple frame concerns in one global object instead of frame-specific templates.
7. Feature flags/fix comments indicate iterative patching without centralized changelog governance.
8. App-level state and cross-page events rely on custom window events, increasing coupling.
9. Routing is hash-based with custom parsing logic; docs and route sub-hashes may still be fragile.
10. Undo/redo scope likely covers content but not all design mutations consistently.
11. Export logic likely tightly coupled to DOM state; no pipeline isolation.
12. LocalStorage persistence lacks visible versioning/migration strategy for breaking changes.
13. No explicit data integrity layer between UI inputs and render layer.
14. No clear “domain services” abstraction for validation, transformations, and scoring.
15. No plugin contract yet for third-party frame packs or custom desk modules.
16. Inconsistent naming conventions across terms (`bignum`, `bigLabel`, `statsColor`, etc.).
17. Hidden technical debt in inline styles (hard to theme/refactor at scale).
18. No documented performance boundaries per frame type.
19. No central telemetry contract (render duration, export duration, failure reasons).
20. No clear anti-corruption layer for external data imports.

### Fix Plan (A)
- Split `WhizFrame` into `layouts/*`, `primitives/*`, `theme/*`, `validators/*`.
- Add typed content schemas per frame family + migration engine.
- Move business rules (non-negotiables) into pure validators with auto-fixes.
- Introduce structured events/store (Zustand/Redux Toolkit) for predictable state.

---

## B. Visual System Fidelity (to your target metaphor)

21. Color usage discipline is configurable but not enforced; users can over-color everything.
22. Theme accent can leak into too many elements; no “4 placements max” rule engine.
23. Typography quantization exists conceptually but sliders allow arbitrary values.
24. Editorial hierarchy can collapse with long title/deck/body without strict overflow strategies.
25. Ticker bar style fidelity varies by frame and override choices.
26. Slug block tone can drift due to freeform input casing/format.
27. Topic tag format not strictly normalized (`▸ TAG` convention may break).
28. Spine placement/rotation fidelity may drift by ratio or custom edits.
29. Corner trim signature is present but should be tokenized and locked.
30. Footer status semantics are too freeform for publication consistency.
31. Too many stylistic toggles can undermine “publication sameness.”
32. Layouts may not all preserve negative space principles under dense content.
33. Theme neutrals are editable, risking loss of brand cohesion.
34. Table aesthetics can devolve into non-Bloomberg style (borders/grid drift).
35. Sparkline style constraints are not strict enough.
36. Pill/chip semantics vary across layouts.
37. Visual rhythm between sections lacks strict spacing tokens.
38. Rotated spine text legibility not guaranteed on all theme contrasts.
39. Accent glows/noise effects may over-stylize serious risk frames.
40. Big-number auto-size heuristic is simplistic and can still create poor hierarchy.

### Fix Plan (B)
- Add “Strict Whiz Mode” that locks brand tokens and only allows sanctioned edits.
- Encode a design linter (color-count, font-family, size scale, spacing token checks).
- Add pre-export “brand compliance score” and autofix suggestions.

---

## C. Frame Library & Template Quality (all 50)

41. Some frames may be implemented as style variants, not true structural templates.
42. Frame definitions need completeness checks (required fields, optional fields, examples).
43. Tier balance (A-H) needs coverage analytics in-library.
44. Similar frames (20/36 Yield Tape) need explicit variant inheritance rules.
45. No “difficulty/effort” metadata visible for creators.
46. No “best use case / anti-pattern” hints per frame.
47. Missing narrative intent checks (one-question-per-post enforcement).
48. No dataset shape preview before selecting frame.
49. No frame-level “known pitfalls” warnings.
50. No pinned “starter rotation” wizard for M/W/F cadence.
51. Deep-dive frames need richer scaffold prompts (thesis, mechanism, risk).
52. Risk frames should default to Liquidation Red to reduce operator error.
53. Comparison frames need deterministic sorting defaults.
54. Timeline frames need strict date normalization and locale handling.
55. Map/network frames need collision avoidance and spacing helpers.
56. Bracket frame needs auto-progression logic from seed scores.
57. Field guide frame requires content microcopy templates for tone consistency.
58. Cover story frame needs hero safe-zones and text-over-image contrast guardrails.
59. Glossary frame needs alphabetic auto-grouping.
60. Receipt frame should auto-calculate fee totals and implied slippage.

### Fix Plan (C)
- Add JSON schema per frame + content wizard.
- Add frame readiness checks: required data fields, char budgets, recommended ratios.
- Add “weekly cadence packs” with pre-linked templates.

---

## D. Editor UX (power-user perspective)

61. Editor is feature-rich but cognitively heavy for fast publishing.
62. Design/content split is useful but still overloaded.
63. Key actions are distributed across multiple panels and floating controls.
64. Too many controls require mouse travel; keyboard command surface is limited.
65. No command palette for power workflows.
66. Insufficient inline guidance for why a control should be used.
67. No staged workflow mode (Outline → Populate → Polish → Validate → Export).
68. No hard “publish readiness” checklist in-editor.
69. Undo/redo visibility is minimal; no history timeline.
70. Save management lacks tagging/search/foldering.
71. No diff view between saves.
72. No “lock section” controls to prevent accidental edits.
73. No content overflow indicators per field before export.
74. No smart truncation/ellipsis policy controls.
75. No bulk table paste with robust parser + validation hints.
76. No auto-normalization for numeric fields (%,$,M,B).
77. No data provenance panel attached to each stat/table row.
78. No quick duplicate/clone post flow with auto issue increment.
79. Mobile editor likely constrained for serious work.
80. No role-based modes (Creator vs Reviewer vs Publisher).

### Fix Plan (D)
- Add “Pro Workflow Rail” with ordered steps and pass/fail gates.
- Add command palette + keyboard map overlay.
- Add save diffing, save labels, and publish states.

---

## E. UI Clarity, Accessibility, and Usability

81. Contrast may fail in muted text zones on some backgrounds.
82. Small monospace text at 10px may be unreadable on some devices.
83. Icon-only actions need better labels/tooltip consistency.
84. Keyboard navigation likely incomplete for complex panels.
85. Focus order/focus ring consistency uncertain.
86. ARIA labeling coverage appears partial (inputs mixed).
87. Export/status toasts may be transient without persistent activity log.
88. Motion effects (ticker/blur/glow) need reduced-motion support.
89. Color-only meaning in risk/severity should include shape/text redundancy.
90. No built-in dyslexia-friendly/large-text preview mode.
91. No screen-reader optimized textual summary per frame export.
92. No accessibility preflight before export.
93. Dense sidebars can overwhelm novice users.
94. No progressive disclosure by expertise level.
95. No explicit empty states in some data-heavy templates.
96. Missing confirmation patterns for destructive actions in all contexts.
97. Inconsistent control sizing may harm touch targets.
98. Potential scrollbar/jump friction in long right-panel forms.
99. No global find/replace in content.
100. Missing internationalization foundation (dates/number formatting).

### Fix Plan (E)
- Add WCAG AA checks, font-size minimums, and accessible preset themes.
- Add reduced-motion toggle and semantic redundancy rules.
- Add a11y test automation (axe + Storybook checks).

---

## F. Data Integrity, Trust, and Research Workflow

101. No enforced source-link requirements for each critical number.
102. No timestamping of data freshness at export.
103. No “primary source only” badges for high-trust claims.
104. No confidence metadata per figure.
105. No stale-data detection rules (e.g., APR older than X hours).
106. No outlier detection for suspicious value jumps.
107. No unit normalization engine across imported data.
108. No evidence ledger attached to frame issue number.
109. No citation footnote layer in visual itself (optional compact mode).
110. Manual entry remains high-risk for decimal/currency mistakes.
111. No “verify before publish” blocking gate.
112. No team review sign-off workflow.
113. No post-publication correction tracking.
114. No transparent provenance export alongside PNG.
115. No dataset snapshot lock for reproducibility.
116. No auto-calc cross-checks (totals, percentages, ranking logic).
117. No constraints to prevent impossible combinations (e.g., negative TVL with positive category grade).
118. No audit trail for who edited what/when.
119. No duplicate project/entity detection in tables.
120. No trust-level indicator in UI (Draft data vs Verified data).

### Fix Plan (F)
- Add data schema + validation + required source URLs.
- Introduce verification states (Unverified/Peer-Reviewed/Verified).
- Add export metadata manifest (`issue.json`) with evidence pointers.

---

## G. Performance, Stability, and Export Quality

121. Rendering cost may spike with effects + dense layouts + large images.
122. No clear frame complexity score or warning.
123. Export performance can degrade on lower-end machines.
124. Possible memory pressure from embedded data URLs in saves.
125. No image optimization pipeline (compression, dimension checks).
126. No explicit WebP/PNG quality presets by use case.
127. No deterministic export profile for X/Substack/Farcaster presets.
128. Potential layout jitter due to dynamic font loading.
129. No measured CLS-like metric in editor preview.
130. No worker-based off-main-thread export path.
131. No timeout/retry strategy for export failures.
132. No snapshot comparison to catch subtle rendering regressions.
133. No fallback handling for missing local fonts.
134. No cache invalidation strategy for theme/font changes.
135. Potential unnecessary re-renders from broad state updates.
136. Inline style object recreation may hurt rendering efficiency.
137. No profiler-informed optimization backlog.
138. No performance budget CI gate.
139. No user-visible diagnostics for heavy layouts.
140. No crash recovery or auto-save conflict handling strategy.

### Fix Plan (G)
- Instrument render/export timings.
- Move heavy export to worker/canvas pipeline where possible.
- Add complexity warnings + safe mode (effects off).

---

## H. QA, Testing, and Release Discipline

141. No explicit unit test map for frame rendering primitives.
142. No contract tests for frame schemas.
143. No visual regression suite across themes/ratios/frames.
144. No golden fixtures for default content outputs.
145. No end-to-end tests for critical journeys.
146. No test coverage policy by module criticality.
147. No deterministic snapshot for export outputs.
148. No bug taxonomy linked to root-cause categories.
149. Fix comments in code suggest reactive patching; needs preventive test capture.
150. No chaos testing for malformed content/imports.
151. No compatibility matrix for browser/export fidelity.
152. No staging sign-off checklist for release.
153. No rollback playbook for broken releases.
154. No canary release process.
155. No structured postmortem template for incidents.
156. No regression guards for accessibility.
157. No migration tests for persisted storage versions.
158. No test fixtures for every tier A–H template family.
159. No synthetic benchmark suite for performance trend tracking.
160. No enforcement of lint/format/type checks in CI gates.

### Fix Plan (H)
- Build layered test pyramid: unit + integration + visual + E2E.
- Add mandatory PR checks and release checklist automation.
- Make every bug fix require a corresponding regression test.

---

## I. Product Logic & Workflow Automation Gaps

161. Cadence logic (Mon/Wed/Fri) is not first-class in planner intelligence.
162. No issue-number autopilot with collision prevention.
163. No recurring series support and continuity links.
164. No quarterly cover-story reminders/milestones.
165. No “banger detector” heuristics linked to engagement metadata.
166. No tagging workflow automation for featured protocols.
167. No content calendar health score.
168. No backlog grooming assistant for frame-topic matching.
169. No narrative arc planner (weekly → monthly thesis).
170. No notion/substack publishing bridge.
171. No post-performance ingestion loop for learning.
172. No automated “first 50” progress milestones and unlocks.
173. No frame recommendation engine based on data shape.
174. No anti-duplication check for recently used visuals/topics.
175. No controlled vocabulary for tags/categories.
176. No confidence-weighted ranking for opportunities.
177. No planned-vs-published drift alerts.
178. No SLA reminders for data verification windows.
179. No creator workload balancing tools.
180. No “ship-now” mode that optimizes speed with safe defaults.

### Fix Plan (I)
- Add planner intelligence layer + reminders + cadence enforcement.
- Build integrations (Notion/Substack export packages).
- Add retrospective analytics to improve frame selection over time.

---

## J. Security, Privacy, and Reliability

181. LocalStorage-only persistence risks data loss/corruption.
182. No encrypted local project vault option.
183. No backup/restore workflow with version checks.
184. Imported JSON may not be fully sanitized/validated.
185. Potential XSS vectors if rich text/html export paths are lenient.
186. No integrity hash for saved artifacts.
187. No dependency vulnerability policy visible.
188. No CSP/report-only hardening strategy (if hosted).
189. No abuse throttles for oversized image uploads.
190. No safe-guard for huge pasted datasets.
191. No privacy mode for hiding handles in screenshots.
192. No redaction tools for sensitive draft notes.
193. No disaster recovery documentation.
194. No data retention controls.
195. No signed export manifests for collaborative verification.
196. No tamper-evident provenance chain for published artifacts.
197. No health checks/heartbeat if offered as hosted app.
198. No error budget targets.
199. No SLOs for export success and editor responsiveness.
200. No incident alert routing strategy.

### Fix Plan (J)
- Add schema sanitation, backup/restore, and secure import pipeline.
- Define SLOs + error budgets + incident response.
- Add dependency and security scanning in CI.

---

## K. Prioritized Execution Roadmap (Bug-safe)

### Phase 0 (Week 1): Baseline & Safety Rails
- Freeze feature work; instrument app.
- Add error tracking and export/render timings.
- Create frame schema contracts + migration scaffold.
- Define release checklist and “definition of done.”

### Phase 1 (Weeks 2–3): Brand Rule Enforcement
- Implement Strict Whiz Mode + design linter.
- Lock 3 fonts, quantized sizes, color placement limits.
- Add compliance panel with pass/fail and auto-fixes.

### Phase 2 (Weeks 4–6): Editor Reliability + UX
- Refactor monolith renderer into modular layout engine.
- Add workflow rail, command palette, save diffing/history.
- Add overflow warnings and content validators.

### Phase 3 (Weeks 7–8): Data Trust Layer
- Require sources for key metrics.
- Add freshness timestamps, verification states, and issue manifest.
- Add publish gate that blocks unverified critical numbers.

### Phase 4 (Weeks 9–10): Performance & Export
- Optimize render cycles and heavy effects.
- Add export presets and worker path.
- Introduce complexity warnings + safe mode.

### Phase 5 (Weeks 11–12): QA Hardening
- Visual regression for all key frame/theme/ratio combos.
- E2E workflows for create→validate→export.
- CI policies: type, lint, tests, snapshots.

### Phase 6 (Ongoing): Planner Intelligence & Integrations
- Cadence automation, series tracking, quarterly milestones.
- Notion/Substack export and feedback loops.

---

## L. “Do This Next” Sprint Backlog (First 25 tickets)
1. Extract `layout registry` from `WhizFrame` switch.
2. Add `FrameSchema` runtime validator.
3. Remove duplicated default keys in editor content model.
4. Add storage version + migration table.
5. Implement quantized type scale selector (no freeform).
6. Enforce single theme color policy with placement tracker.
7. Add read-only master frame shell layer.
8. Add pre-export compliance modal.
9. Add overflow diagnostics per text field.
10. Add table numeric formatter/parser.
11. Add source URL field per stat and row.
12. Add data freshness badge.
13. Add required verification for risk/yield claims.
14. Add keyboard shortcut palette.
15. Add save comparison view.
16. Add role presets (Creator/Reviewer/Publisher).
17. Add reduced-motion toggle.
18. Add contrast checker + AA auto-suggestions.
19. Add image upload dimension guard.
20. Add export preset profiles by channel.
21. Add render/export performance HUD (debug mode).
22. Add visual regression baseline for top 10 frames.
23. Add E2E test for Watchlist workflow.
24. Add release gate in CI with required checks.
25. Add postmortem template + bug taxonomy.

---

## M. Anti-Bug Implementation Strategy
- Prefer additive, behind-flag changes before replacing core paths.
- Keep old and new render paths in parallel until snapshot parity >= 98%.
- Introduce one risk area per release (render OR export OR persistence, not all).
- Require regression tests for every bug fix.
- Use migration tests before enabling new storage versions.
- Add feature kill switches for new editor subsystems.
- Monitor error rate and export failure rate daily during rollout.

---

## O. Incident Postmortem Policy (Mandatory)

### 1) Postmortem Template (required sections)
Use this template for every qualifying incident. Do not mark complete until every section is filled.

```markdown
# Incident Postmortem

## Incident metadata
- Incident ID:
- Date/time opened (UTC):
- Date/time resolved (UTC):
- Severity (SEV-1/SEV-2/SEV-3):
- Customer impact summary:
- Detection source (monitoring, user report, QA, etc.):

## Timeline (required)
- YYYY-MM-DD HH:MM UTC — Event
- YYYY-MM-DD HH:MM UTC — Event

## Root cause (required)
- Primary root cause:
- Evidence supporting root cause:

## Contributing factors (required)
- Factor 1:
- Factor 2:

## Detection gaps (required)
- What should have detected this earlier:
- Why detection failed or lagged:

## Action items (required)
| ID | Action | Type (Prevent/Detect/Mitigate) | Priority | Owner | Due date (YYYY-MM-DD) | Tracking link | Status |
|----|--------|---------------------------------|----------|-------|------------------------|---------------|--------|
| A1 |        |                                 |          |       |                        |               | Open   |

## Owners (required)
- Incident commander:
- Postmortem author:
- Engineering owner:
- Product owner:

## Due dates (required)
- Postmortem publication due date:
- Action review checkpoint dates:
- Final closure target date:
```

### 2) When postmortems are mandatory
Postmortems are required for any of the following:
- Any SEV-1 or SEV-2 production incident.
- Any bug that causes incorrect financial/risk numbers, broken exports, or data loss.
- Any release rollback/hotfix within 48 hours of deployment.
- Repeated defect pattern: same taxonomy category appears 2+ times in 30 days.
- Any incident that breaches release quality gates (see Section N metrics).

### 3) Action tracking to closure
- Every action item must have a single owner and a due date before postmortem approval.
- Action items are tracked in the release board with status: Open → In Progress → Blocked/Done.
- Weekly triage reviews all Open/Blocked actions; overdue items require escalation to eng lead.
- Incident is only closed when all Prevent/Detect actions are Done or formally risk-accepted.
- Time-to-closure and overdue-action rate are reported in release quality review.

### 4) Integration with bug taxonomy
- Root cause and each contributing factor must map to one bug taxonomy label.
- Taxonomy labels should align with editor risk domains (schema, render, export, data trust, performance, UX, accessibility, release process).
- Recurrent taxonomy clusters feed sprint planning and the “First 25 tickets” backlog prioritization.
- Taxonomy recurrence (count by label, 30-day trend) is included in incident dashboarding.

### 5) Integration with release quality metrics
- Each incident must state which Section N metric(s) regressed (export failure rate, compliance rate, latency, source attribution, regression pass rate).
- Every release includes: incident count by severity, MTTD, MTTR, action closure SLA, and repeat-incident rate by taxonomy.
- Release cannot pass quality gate when critical incident actions are overdue or repeat-incident rate is rising release-over-release without mitigation plan.

---

## N. Success Metrics (what “fixed” looks like)
- 95%+ compliance with Whiz visual rules across published frames.
- <1% export failure rate.
- <200ms median interaction latency in editor controls.
- 100% critical data fields with source attribution.
- 90%+ visual regression pass across canonical frame fixtures.
- 50-frame template completion with schema validation and preview fixtures.

