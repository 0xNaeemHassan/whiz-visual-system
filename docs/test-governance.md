# Test Governance: Preventative Gates vs Diagnostics

This policy defines which checks block merges, which checks are diagnostic-only, and how recurring regressions are escalated.

## 1) Test Classification

### Preventative gates (must pass before merge)

These checks run in required CI status checks on every pull request.

| Tier | Check | Current command(s) | Why this is mandatory |
|---|---|---|---|
| Gate-1 | Smoke + interaction/a11y baseline | `npm test` | Protects critical editor flows and catches broad functionality breaks quickly. |
| Gate-2 | Type and lint quality | `npm run typecheck`, `npm run lint` | Prevents unsafe type drift and syntax/quality regressions from reaching main. |
| Gate-3 | Export and service contract integrity | `npm run check:exports`, `npm run check:services`, `npm run check:states` | Verifies high-risk rendering/export/service pathways remain contract-compliant. |
| Gate-4 | High-risk accessibility checks | `npm run check:a11y` | Blocks regressions in labels, touch targets, and semantic chips that impact usability and compliance. |
| Gate-5 | Performance budget check | `npm run check:perf` | Stops merges that exceed key performance safety budgets. |

### Diagnostic checks (non-blocking by default)

These checks provide early warning signals but do not block merge unless explicitly promoted.

| Tier | Check type | Example command(s) | Typical trigger |
|---|---|---|---|
| Diag-1 | Deep scenario drills | `node scripts/test-editor-mutations.mjs` | Nightly and release-candidate branches. |
| Diag-2 | Specialized locale/edge validations | `node scripts/test-locale-formatting.mjs` | Internationalization changes or date/number formatting incidents. |
| Diag-3 | Exploratory perf diagnostics | targeted custom runs | Performance triage and local investigations. |

## 2) Promotion Policy: Move High-Risk Smoke Checks to Mandatory Suites

A check must be promoted from smoke/diagnostic to a mandatory gate when **any** of the following is true:

1. The subsystem is in the critical path (editor state, export pipeline, data persistence, accessibility baseline).
2. The same defect class reoccurs 2+ times within 30 days.
3. Severity is `High` or above (user-facing data integrity, broken publish/export, or accessibility blockers).

When promoted, each suite must declare:

- **Owner:** one accountable team/person (e.g., `@editor-platform` or `@accessibility-champions`).
- **Flake SLA:**
  - Acknowledge flaky failure within **1 business day**.
  - Stabilize or quarantine with issue link within **3 business days**.
  - Restore mandatory status within **5 business days** if temporarily quarantined.
- **Run policy:** required PR check and nightly run with trend retention.

## 3) Recurring Regression Escalation Path

When regressions recur in the same subsystem:

1. **Incident open (same day):** File a regression incident and tag subsystem owner.
2. **Hot triage (within 24h):** Reproduce, identify failure signature, and add/update regression test coverage.
3. **Escalate to quality review (after 2 recurrences / 30 days):**
   - Require lead review for affected subsystem PRs.
   - Convert related diagnostic checks to mandatory gates.
   - Add subsystem-specific checklist items to PR template/review rubric.
4. **Program escalation (after 3 recurrences / 60 days):**
   - Freeze risky refactors in the subsystem until stability goals are met.
   - Run a focused hardening sprint with daily defect burn-down.
   - Publish a post-incident summary with prevention actions and owners.

## 4) Flaky Test Handling Rules

- Flaky tests are **never ignored silently**.
- A quarantined test requires:
  - linked tracking issue,
  - named owner,
  - target date to re-enable gate behavior.
- If the target date slips twice, escalate to engineering manager or release owner for a recovery plan.
