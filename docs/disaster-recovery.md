# Disaster Recovery Runbook

- **Owner:** Platform + Application Reliability
- **Last Reviewed:** 2026-05-03
- **Review Cadence:** Quarterly
- **Severity Scope:** SEV-1 / SEV-2 outages affecting editor or export

## Recovery Objectives

| Capability | RTO | RPO | Notes |
| --- | --- | --- | --- |
| Editor API + session save | 60 minutes | 15 minutes | Requires primary DB restore + cache warmup. |
| Export pipeline (render + package) | 90 minutes | 30 minutes | Queued exports can be replayed from signed manifests. |
| Public asset delivery | 45 minutes | 10 minutes | CDN + object storage failover. |

## DR Activation Criteria

Activate DR plan when any condition is met:
1. Regional outage expected > 20 minutes.
2. Data store corruption affecting write-path correctness.
3. Security isolation event requiring environment rebuild.
4. Core SLO burn rate exceeds 4x for 30 minutes with no rollback path.

## Failover Sequence

1. Declare incident and assign Incident Commander.
2. Freeze deploys and config mutations.
3. Promote warm standby stack in secondary region.
4. Restore latest verified snapshot + replay write-ahead log up to RPO limit.
5. Repoint traffic using weighted routing (10% → 50% → 100%).
6. Run smoke suite for editor save, export generation, and signed manifest verification.
7. Announce DR mode and start 30-minute stakeholder updates.

## Data Restore and Validation

- Restore from immutable backup bucket with retention lock enabled.
- Validate row counts for tenant, document, and export_manifest tables.
- Recompute checksums for latest 100 exports and compare with signed manifests.
- Verify provenance chain continuity from restored head to current export events.

## Return-to-Primary (Failback)

Failback only after 24 hours of stable operation and all conditions below:
- Error rate back within SLO thresholds for two consecutive windows.
- Replication lag < 60 seconds.
- Backup jobs and heartbeat checks green.
- Post-incident actions documented with owners and due dates.

## Evidence to Capture

- Incident timeline with UTC timestamps.
- Backup snapshot ID and WAL replay boundary.
- SLO burn-rate screenshots.
- Manifest verification logs and provenance digest reports.
