# Test Coverage Policy

Coverage is collected from unit and integration test runs using Node's V8 coverage output (`NODE_V8_COVERAGE`). CI enforces risk-tier thresholds and fails on any breach.

## Risk-tier thresholds

| Tier | Scope | Minimum coverage |
|---|---|---:|
| High risk | `src/domain/**`, `src/utils/**`, `src/state/**` | 85% |
| Medium risk | `src/components/whizframe/**`, `src/i18n/**`, `src/router/**` | 75% |
| Low risk (UI cosmetics) | `src/components/**`, `src/pages/**`, `src/index.css` | 60% |

> Notes:
> - Higher-risk logic paths must meet stricter thresholds than cosmetic/UI-focused paths.
> - Threshold source of truth: `config/coverage-thresholds.json`.

## CI enforcement

CI runs:

```bash
npm run coverage:check
```

This command:
1. runs the unit/integration test suite with V8 coverage enabled,
2. aggregates coverage by risk tier,
3. fails with a non-zero exit code when a tier is below minimum.

## Coverage exception process

Exceptions are temporary and must be reviewed.

Required in PR description:
1. **Justification**: why the threshold cannot currently be met.
2. **Scope**: exact tier/files impacted.
3. **Remediation plan**: what work and date will close the gap.
4. **Owner approval**: explicit approval from a code owner (or designated maintainer) for the impacted area.

Without owner approval, threshold exceptions must not be merged.
