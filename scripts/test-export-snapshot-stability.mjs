import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatasetSnapshot, createExportAttemptSnapshot } from '../src/utils/exportSnapshot.js';
import { buildCitationModel } from '../src/domain/export/citationModel.js';
import { resolveExportProfile } from '../src/domain/export/exportProfileResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, 'fixtures', 'export-snapshot-stability.json');

const FIXED_ISO = '2026-01-02T03:04:05.678Z';
const RealDate = Date;
class MockDate extends RealDate { constructor(...args) { super(args.length ? args[0] : FIXED_ISO); } static now() { return new RealDate(FIXED_ISO).getTime(); }}

function withDeterministicRuntime(fn) {
  const originalDate = globalThis.Date;
  const originalRandom = Math.random;
  const originalDpr = globalThis.devicePixelRatio;
  globalThis.Date = MockDate;
  Math.random = () => 0.123456789;
  globalThis.devicePixelRatio = 2;
  try { return fn(); } finally { globalThis.Date = originalDate; Math.random = originalRandom; globalThis.devicePixelRatio = originalDpr; }
}

const actual = withDeterministicRuntime(() => {
  const datasetInput = { frameId: 7, theme: { base: '#111111', accent: '#33AAFF' }, content: { title: 'Stable exports [1]', deck: 'Deterministic payload for CI', body: 'Body claim [2] with proof.' }, overrides: { title: { fontSize: 52, color: '#ffffff' } }, aspectRatio: { w: 1200, h: 675 }, bgGradient: { from: '#0f172a', to: '#1e293b' }, patternOverlay: 'grid' };
  const citations = buildCitationModel({ title: 'Stable exports [1]', body: 'Body claim [2] with proof.', metricProvenance: { label: 'Metric', source: 'Dashboard', date: '2025-12-31' }, tableRows: [{ provenance: { label: 'Row', source: 'Warehouse', date: '2025-12-30' } }] }, 'full');
  const profile = resolveExportProfile({ deviceClass: 'mobile', performanceTier: 'low', baseDimensions: { width: 1200, height: 675 }, format: 'png' });
  const datasetSnapshot = createDatasetSnapshot(datasetInput);
  const exportAttemptSnapshot = createExportAttemptSnapshot({ theme: datasetInput.theme, overrides: datasetInput.overrides, normalizedContent: { ...datasetInput.content, citations: citations.boundText }, contract: { dimensions: profile.targetDimensions, quality: profile.quality, citationMode: 'full' }, outputMetadata: { exportedAt: FIXED_ISO, locale: 'en-US', devicePixelRatio: 2, profile } });
  return { fixedRuntime: { iso: FIXED_ISO, locale: 'en-US', devicePixelRatio: 2 }, citations, profile, datasetSnapshot, exportAttemptSnapshot };
});

if (process.env.UPDATE_EXPORT_SNAPSHOT_FIXTURE === '1') {
  fs.writeFileSync(fixturePath, `${JSON.stringify(actual, null, 2)}\n`);
  console.log('Export snapshot fixture updated');
} else {
  const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  assert.deepEqual(actual, expected, 'Export snapshot fixture drift detected.');
  console.log('Export snapshot stability tests passed');
}
