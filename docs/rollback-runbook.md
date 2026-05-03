# Rollback Runbook

- **Owner:** Release Engineering
- **Last Reviewed:** 2026-05-03
- **Review Cadence:** Quarterly

## Purpose
This runbook defines when and how to execute a rollback for application deployments, with explicit checks for data and storage compatibility.

## Trigger Criteria
Initiate rollback when any of the following are true after a release:

- **Availability**: sustained 5xx/API error rate above SLO for 10+ minutes.
- **Latency**: p95 latency above 2x baseline for 15+ minutes.
- **Functional regression**: critical user journey fails (login, save, publish, checkout-equivalent path).
- **Data integrity risk**: incorrect writes, corrupt records, or irreversible transformation bug.
- **Security issue**: newly introduced vulnerability or policy bypass.
- **Deployment health**: failed canary, repeated crash loops, or rollout stalls.

## Owner Roles
- **Incident Commander (IC)**: decides rollback/no-rollback, owns timeline and communications.
- **Release Engineer**: executes deploy rollback commands and confirms runtime health.
- **Application Owner**: validates feature behavior and business-critical flows.
- **Data Owner (DBA/Platform)**: validates schema/storage compatibility and data safety.
- **Communications Lead**: sends stakeholder updates and closes incident message loop.

## Prerequisites
- Access to deploy tooling, observability dashboards, and logs.
- Previous stable release identifier (for example: image tag, git SHA, Helm revision).
- Current migration status for database and storage transformations.
- Stakeholder contact channels (Slack/Teams, status page, on-call list).

## Rollback Procedure (Application Deploy)

### 1) Stabilize and decide
1. Freeze new deployments.
2. Confirm trigger criteria with metrics/logs.
3. IC announces rollback decision with target release version.

### 2) Execute rollback
Use the command set matching your deployment platform.

#### Option A: Kubernetes + Helm
```bash
# Inspect recent revisions
helm history <release_name> -n <namespace>

# Roll back to previous good revision
helm rollback <release_name> <revision_number> -n <namespace>

# Watch rollout
kubectl rollout status deploy/<deployment_name> -n <namespace> --timeout=5m
```

#### Option B: Container image roll back
```bash
# Set deployment image to last known good tag
kubectl set image deploy/<deployment_name> <container_name>=<registry>/<image>:<good_tag> -n <namespace>

# Verify rollout
kubectl rollout status deploy/<deployment_name> -n <namespace> --timeout=5m
```

#### Option C: GitOps (Argo CD / Flux)
```bash
# Revert manifest/image change in git
git revert <bad_commit_sha>
git push origin <branch>

# Force reconciliation if needed
argocd app sync <app_name>
```

### 3) Data and storage compatibility checks
Perform these checks before declaring recovery complete.

1. **Schema compatibility**
   - Verify whether the failed release ran forward-only migrations.
   - If migration is backward-incompatible, keep schema at new version and roll back app code to a compatibility build.
   - If down migration is approved and tested, execute controlled rollback migration.

2. **Write-path safety**
   - Confirm older app version can read/write records created by the failed version.
   - Validate enum/value changes, nullability assumptions, and default values.

3. **Storage/object format**
   - Check for changes to file/object naming, metadata, compression, encryption, or serialization.
   - Validate that restored app can parse newly written objects.

4. **Cache and queue compatibility**
   - Invalidate incompatible cache keys/prefixes.
   - Drain/replay or quarantine incompatible queue messages.

5. **Feature flags**
   - Disable newly released flags that mutate data shape or persistence behavior.

### 4) Post-rollback verification
- Service health endpoints return success.
- Error rate and latency return to baseline.
- Critical user flows pass smoke tests.
- No active crash loops/restarts beyond baseline.
- Data correctness spot checks succeed.

Example verification commands:
```bash
kubectl get pods -n <namespace>
kubectl logs deploy/<deployment_name> -n <namespace> --since=10m
kubectl get events -n <namespace> --sort-by=.lastTimestamp | tail -n 30
```

## Communication Templates

### Rollback start (internal)
> **Subject:** [SEV-<level>] Rollback initiated for <service>\
> **When:** <UTC timestamp>\
> **Reason:** <trigger criteria + observed impact>\
> **Action:** Rolling back from <bad_version> to <target_version>\
> **Owner:** IC=<name>, Release=<name>, Data=<name>\
> **Next update:** <time, e.g., +15 min>

### Rollback progress update
> **Subject:** [SEV-<level>] Rollback in progress for <service>\
> **Status:** <rollout percent / completed deploy rollback>\
> **Health:** <errors/latency trend>\
> **Data checks:** <pass/fail/in-progress>\
> **Next update:** <time>

### Rollback complete
> **Subject:** [Resolved] Rollback completed for <service>\
> **Completed at:** <UTC timestamp>\
> **Result:** Restored to <target_version>; service health back to baseline\
> **Data/storage validation:** <summary>\
> **Follow-up:** Post-incident review by <date>

## Exit Criteria
Rollback is complete only when:
- Application is serving stable traffic on known-good version.
- Required data/storage compatibility checks are complete.
- Communications are sent and incident status is updated.
- A post-incident action list is opened.

## Governance Dependencies

Rollback and recovery decisions depend on the following controls:

- **Signed export manifests:** each export package includes manifest signature and checksum verification step before republish.
- **Tamper-evident provenance chain:** artifact lineage is modeled as append-only hash-linked events (`prev_digest`, `event_digest`, `signature`).
- **Hosted heartbeat checks:** `/healthz` and synthetic editor/export probes execute every 60 seconds from two regions.
- **Alert routing:** SEV-1 pages primary on-call + incident channel; SEV-2 routes to service rotation with 15-minute acknowledgment SLA.
- **SLO and error budget policy:** rollback is mandatory when monthly error budget burn exceeds 100% or short-window burn rate exceeds 4x.

See also:
- `docs/disaster-recovery.md`
- `docs/data-retention.md`
