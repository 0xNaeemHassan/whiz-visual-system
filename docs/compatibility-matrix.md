# Browser/Runtime Compatibility Matrix

## Supported matrix

| Environment | Runtime | PNG export | WebP export | Fallback renderer path | CI status |
|---|---|---:|---:|---:|---|
| Chrome (latest stable) | Browser | ✅ | ✅ | ✅ | Covered by matrix policy + capability assertions |
| Firefox (latest stable) | Browser | ✅ | ✅ | ✅ | Covered by matrix policy + capability assertions |
| Safari 17+ | Browser | ✅ | ✅ | ✅ | Covered by matrix policy + capability assertions |
| Node.js 22 | Headless runtime | ❌ (not supported) | ❌ (not supported) | ✅ | Verified in CI matrix |
| Node.js 20 | Headless runtime | ❌ (not supported) | ❌ (not supported) | ✅ | Verified in CI matrix |

## Expected export parity criteria

1. **PNG parity**: Pixel dimensions and alpha channel are preserved for supported browser exports.
2. **WebP parity**: Visual parity with PNG is expected. Encoder metadata and file-size variance are acceptable.
3. **Fallback renderer parity**: Fallback renderer path must complete without throw and preserve frame hierarchy/text ordering.

## CI matrix tests and capability reporting

- Workflow: `.github/workflows/compatibility-matrix.yml`
- Command: `npm run test:export-compat`
- Test script: `scripts/test-export-compatibility-matrix.mjs`

The test outputs explicit pass/fail per capability (`png`, `webp`, `fallbackRenderer`) for each environment row.

## Known caveats

- Node runtimes are treated as **non-exporting headless environments** for raster outputs; PNG/WebP export is intentionally unsupported there.
- Browser image encoder behavior can vary in metadata and compressed size even when visual output is equivalent.
- Fallback renderer parity currently validates functional rendering continuity, not byte-identical image output.
