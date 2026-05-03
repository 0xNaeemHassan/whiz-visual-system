import assert from 'node:assert/strict';
import { EXPORT_CONTRACT_VERSION, EXPORT_PRESETS, resolveExportContractPreset, createExportContract } from '../src/domain/export/contracts.ts';

console.log('export/contracts contract v1.0.0');

assert.equal(EXPORT_CONTRACT_VERSION, '1.0.0');
assert.ok(EXPORT_PRESETS.high.quality > EXPORT_PRESETS.standard.quality);

const resolved = resolveExportContractPreset({ presetId: 'high', baseDimensions: { width: 1000, height: 500 } });
assert.equal(resolved.presetId, 'high');
assert.equal(resolved.dimensions.width, 1250);
assert.equal(resolved.dimensions.height, 625);

const boundary = resolveExportContractPreset({ presetId: 'draft', baseDimensions: { width: 100, height: 100 } });
assert.equal(boundary.dimensions.width, 320);
assert.equal(boundary.dimensions.height, 320);

const fallback = resolveExportContractPreset({ presetId: 'invalid', baseDimensions: { width: 900, height: 600 } });
assert.equal(fallback.presetId, 'standard');

const created = createExportContract({
  channel: 'x',
  format: 'png',
  dimensions: { width: 1200, height: 630 },
  quality: 0.9,
  background: null,
  citationMode: 'off',
  locale: 'en-US',
  presetId: 'standard',
  effectsPolicy: 'balanced',
});
assert.equal(created.version, '1.0.0');
assert.equal(created.format, 'png');

console.log('export/contracts tests passed');
