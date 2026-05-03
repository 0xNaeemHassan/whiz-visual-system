# Data Retention and Deletion Policy

- **Owner:** Security + Data Governance
- **Last Reviewed:** 2026-05-03
- **Review Cadence:** Semi-annual

## Scope

Applies to editor content, exports, telemetry, operational logs, and incident artifacts managed by Whiz Visual System.

## Retention Schedule

| Data Class | Retention | Deletion Method | Legal Hold |
| --- | --- | --- | --- |
| Editor documents and revisions | 365 days from last update | Hard-delete via scheduled purge job | Yes |
| Export artifacts (binary packages) | 180 days | Object lifecycle expiration + tombstone index update | Yes |
| Signed export manifests + provenance digests | 730 days | Cryptographic erase of envelope key + metadata purge | Yes |
| Audit/security logs | 400 days | Tiered archival then secure delete | Yes |
| Product telemetry (aggregated) | 90 days | Partition drop | No |
| Incident reports and postmortems | 730 days | Manual governance review before delete | Yes |

## Deletion Controls

1. Deletion jobs execute daily at 02:00 UTC.
2. Jobs must emit a signed deletion report including object count and hash of deleted IDs.
3. Failed deletions page on-call if retries exceed 3 attempts.
4. Deletion pipeline must skip resources under active legal hold labels.

## User-Initiated Erasure

- Erasure requests are acknowledged within 24 hours.
- Request fulfillment target: 30 days maximum.
- Exports and manifests tied to the requesting tenant are removed unless blocked by legal hold.
- Completion evidence is stored in deletion audit logs for 2 years.

## Verification and Auditing

- Weekly control: sample 50 deleted records and verify non-recoverability from active stores.
- Monthly control: reconcile retention exceptions and legal holds.
- Quarterly control: policy review and retention table sign-off by Security and Legal.
