# Release Process

## Standard Release Flow
1. Prepare release notes and deployment plan.
2. Validate pre-deploy checks (tests, migrations, feature flags, dashboards).
3. Execute staged rollout.
4. Monitor canary and full rollout metrics.
5. Close release when health and business checks pass.

## Rollback Reference
If release health degrades or data risk is detected, follow the rollback runbook:

- [Rollback Runbook](./rollback-runbook.md)
