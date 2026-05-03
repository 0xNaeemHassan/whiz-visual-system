import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { exportNotionReadyPayload } from '../../../../src/domain/export/adapters/notionAdapter.js';
import { exportSubstackReadyPackage } from '../../../../src/domain/export/adapters/substackAdapter.js';

const fixtureRoot = path.resolve(process.cwd(), 'fixtures/golden/expected/export/adapters');
const exportInput = {
  title: 'Liquidity Shift',
  body: 'Risk remains bid while treasury duration reprices.',
  metadata: {
    issueNumber: 42,
    tags: ['macro', 'altcoins'],
    sources: [
      { label: 'FOMC Minutes', url: 'https://example.com/fomc' },
      'https://example.com/dune',
    ],
    coverAsset: { url: 'https://cdn.example.com/cover.png', alt: 'BTC heatmap', credit: 'Whiz Studio' },
    canonicalSlug: 'issue-42-liquidity-shift',
  },
};

describe('integration adapter contracts', () => {
  it('builds notion payload contract with offline fallback', () => {
    const payload = exportNotionReadyPayload(exportInput);
    const expected = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'notion-ready-payload.json'), 'utf8'));
    expect(payload).toEqual(expected);
  });

  it('builds substack package contract with offline fallback', () => {
    const payload = exportSubstackReadyPackage(exportInput);
    const expected = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'substack-ready-package.json'), 'utf8'));
    expect(payload).toEqual(expected);
  });
});
