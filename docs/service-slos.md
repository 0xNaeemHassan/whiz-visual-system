# Service SLOs and Error Budget Policy

- **Owner:** Reliability Engineering
- **Last Reviewed:** 2026-05-03
- **Review Cadence:** Monthly

## SLO Targets

| Service | SLI | Target | Window |
| --- | --- | --- | --- |
| Editor | Successful save and load requests | 99.9% availability | 30 days |
| Editor | p95 interaction latency | < 800 ms | 30 days |
| Export | Successful export completion | 99.5% availability | 30 days |
| Export | p95 end-to-end export duration | < 120 s | 30 days |

## Error Budget Policy

- Monthly error budget = `1 - SLO` for each SLI.
- Burn alert thresholds:
  - **Fast burn:** >4x budget consumption over 1 hour.
  - **Slow burn:** >2x budget consumption over 6 hours.
- Budget actions:
  1. 50% consumed: freeze non-critical releases and increase canary duration.
  2. 100% consumed: release freeze except incident fixes, mandatory reliability review.
  3. 150% consumed: executive incident review and remediation plan with dated milestones.

## Heartbeat and Alert Routing

- Heartbeat checks run every 60 seconds from at least two hosted regions.
- Checks include:
  - `/healthz` endpoint reachability.
  - Synthetic editor create/save/load transaction.
  - Synthetic export generation + manifest signature verification.
- Alert routing matrix:
  - **SEV-1:** PagerDuty primary + secondary, Slack `#incident-sev1`, status page update.
  - **SEV-2:** Service on-call, Slack `#incident-sev2`, triage within 15 minutes.

## Reporting

- Weekly SLO report distributed to Engineering and Product.
- Monthly error budget review attached to release readiness decision.
