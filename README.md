# whiz-visual-system

## Contribution Notes

When you make a user-visible or behavior change, record it in `docs/CHANGELOG.md` under a new or existing version/date section.

### How to record changes
- Add an entry under the correct version heading using concise bullets.
- Describe **what changed** and **why it matters** (UI, behavior, data, performance, accessibility, etc.).
- Keep entries scoped to shipped changes; omit local experiments.

### Migration notes
Add a **Migration Notes** subsection in the same version block when a change requires action by maintainers or users, for example:
- renamed CSS/JS classes, component props, or route paths,
- changed config/environment keys,
- data shape updates or defaults,
- removed deprecated behavior.

For each migration note, include:
- impact,
- required action,
- safe fallback (if any).

## Coverage policy

Coverage thresholds, CI enforcement, and exception handling are documented in `docs/coverage-policy.md`.
