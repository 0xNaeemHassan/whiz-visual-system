# XSS Review: Threat Model and Sink Inventory

## Scope
This review covers user-controlled rendering paths in:
- Editor content fields and media URLs.
- Import pipeline and normalized content ingress.
- Plugin manifests and metadata.
- Export HTML adapter path.

## Threat model

### Assets
- Reader/browser safety for exported HTML artifacts.
- Integrity of local editor sessions.
- Trustworthiness of plugin metadata used in UI and export surfaces.

### Adversaries
- Malicious content authors supplying script-like payloads in text/image URL fields.
- Compromised import payloads carrying `javascript:` or event-handler attributes.
- Plugin authors attempting manifest-based injection via metadata strings.

### Trust boundaries
- Any editor/input/import/plugin data crossing into DOM rendering or export serialization.
- Any URL assigned to `src`/`href` or CSS URL-like sinks.

## Sink inventory

### 1) Editor rendering
- `FrameShell` image sinks (`logoUrl`, `heroUrl`) now pass through protocol allowlist sanitization (`http:`, `https:`, `data:`, `blob:`). Invalid or unsupported protocols are dropped.
- Uploaded image object/data URLs remain constrained to browser-generated blob/data URLs.

### 2) Import paths
- Imported values are still normalized before content use.
- New policy requires all URL-like fields to pass through `sanitizeUserUrl` before render/export sinks.

### 3) Plugin manifests
- Plugin manifests remain treated as data-only and frozen at registration.
- Manifest metadata must never be inserted via raw HTML sinks.

### 4) Export HTML adapters
- Export path no longer serializes unsanitized frame markup directly.
- HTML export now sanitizes cloned DOM before embedding:
  - strips `<script>` nodes,
  - removes `on*` event attributes,
  - validates `src`/`href` with protocol allowlist.

## Enforced controls
1. **No unsafe HTML injection without sanitizer**
   - ESLint blocks dangerous APIs (`dangerouslySetInnerHTML`, `innerHTML=`, `insertAdjacentHTML`).
   - Dedicated XSS pattern check script fails CI on these patterns.

2. **Strict escaping/sanitization in export adapters**
   - Export HTML uses sanitizer-reviewed fragment serializer before file generation.

3. **URL protocol allowlist**
   - Central URL sanitizer enforces explicit protocol allowlist for URL sinks.

## Verification checks
- `npm run lint` includes ESLint + semantic chips + XSS pattern scan.
- `npm test` includes unit coverage for URL and HTML sanitization behavior.

## Residual risks and follow-ups
- CSS `url(...)` within inline style strings is currently constrained by controlled style generation; keep under review.
- If future rich-text HTML input is introduced, require a robust HTML sanitizer library and policy tests before release.
