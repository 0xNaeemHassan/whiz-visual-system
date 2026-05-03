# Content Security Policy rollout

## Deployment configuration

CSP is configured in `public/_headers` for host-level delivery.

### Phase 1 (current): report-only

`Content-Security-Policy-Report-Only` is enabled with these directives:

- `script-src 'self'`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `img-src 'self' data: blob:`
- `connect-src 'self'`
- `font-src 'self' https://fonts.gstatic.com data:`
- `frame-ancestors 'none'`
- `base-uri 'self'`

Violation reports are sent to:

- `/csp-violation-report`

## Rollout plan

1. Keep report-only active for at least one full release cycle.
2. Collect violation reports from production traffic.
3. Triage each violation as:
   - expected and safe (requires explicit exception), or
   - unexpected (fix code/config to comply).
4. Update the exception registry (below) and policy string.
5. Enable enforcing `Content-Security-Policy` after report volume is stable and known-good.

## Exception registry

Track all non-`'self'` sources here with owner + rationale.

### Approved exceptions

1. `https://fonts.googleapis.com` (for `style-src`)
   - Owner: Design System
   - Rationale: Google Fonts stylesheet hosting.
2. `https://fonts.gstatic.com` (for `font-src`)
   - Owner: Design System
   - Rationale: Google Fonts font binary hosting.

### Dynamic export exceptions (must be explicit)

Current policy allows dynamic local export primitives only:

- `img-src blob:` for in-browser export previews / generated assets.
- `img-src data:` and `font-src data:` for inline encoded assets used by local export flows.

If exports introduce remote fetches (for example third-party rendering APIs, CDN images, or webhook callbacks), add exact origins to `connect-src`/`img-src` before enforcement and record the approval in this document.

## Enforcement gate checklist

Before switching to `Content-Security-Policy` enforcement:

- [ ] No untriaged violations in the last release cycle.
- [ ] Google Fonts exceptions still required and documented.
- [ ] Dynamic export pathways validated against `img-src` + `connect-src`.
- [ ] Enforcement header uncommented in `public/_headers` and report-only retained temporarily for overlap.
