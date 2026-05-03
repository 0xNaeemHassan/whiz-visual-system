import assert from 'node:assert/strict';
import fs from 'node:fs';

const FRAME_DATA_PATH = new URL('../src/data/frames.js', import.meta.url);

export const REQUIRED_FIXTURE_SETS = Object.freeze(['happyPath', 'edgeCase', 'invalidCase']);

const mkSuiteFixture = (tier) => ({
  happyPath: { tier, scenario: 'happyPath' },
  edgeCase: { tier, scenario: 'edgeCase' },
  invalidCase: { tier, scenario: 'invalidCase' },
});

export const FRAME_FAMILY_FIXTURES = Object.freeze({
  contract: Object.freeze({ A: mkSuiteFixture('A'), B: mkSuiteFixture('B'), C: mkSuiteFixture('C'), D: mkSuiteFixture('D'), E: mkSuiteFixture('E'), F: mkSuiteFixture('F'), G: mkSuiteFixture('G'), H: mkSuiteFixture('H') }),
  visual: Object.freeze({ A: mkSuiteFixture('A'), B: mkSuiteFixture('B'), C: mkSuiteFixture('C'), D: mkSuiteFixture('D'), E: mkSuiteFixture('E'), F: mkSuiteFixture('F'), G: mkSuiteFixture('G'), H: mkSuiteFixture('H') }),
  exportSnapshot: Object.freeze({ A: mkSuiteFixture('A'), B: mkSuiteFixture('B'), C: mkSuiteFixture('C'), D: mkSuiteFixture('D'), E: mkSuiteFixture('E'), F: mkSuiteFixture('F'), G: mkSuiteFixture('G'), H: mkSuiteFixture('H') }),
});

export function getTierMetadataFromFrames() {
  const source = fs.readFileSync(FRAME_DATA_PATH, 'utf8');
  const tierMatches = [...source.matchAll(/tier:\s*'([A-H])'\s*,\s*tierName:\s*'([^']+)'/g)];
  const byTier = new Map();
  tierMatches.forEach(([, tier, tierName]) => {
    if (!byTier.has(tier)) byTier.set(tier, tierName);
  });
  return [...byTier.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tier, tierName]) => ({ tier, tierName }));
}

export function assertFixtureCompletenessForSuite(suiteName) {
  const suiteFixtures = FRAME_FAMILY_FIXTURES[suiteName];
  assert.ok(suiteFixtures, `Unknown fixture suite: ${suiteName}`);
  const missing = [];
  getTierMetadataFromFrames().forEach(({ tier, tierName }) => {
    const tierFixture = suiteFixtures[tier];
    if (!tierFixture) return missing.push(`${suiteName}: tier ${tier} (${tierName}) missing all fixture sets`);
    REQUIRED_FIXTURE_SETS.forEach((setName) => {
      if (!tierFixture[setName]) missing.push(`${suiteName}: tier ${tier} (${tierName}) missing ${setName}`);
    });
  });
  assert.equal(missing.length, 0, `Fixture completeness check failed:\n${missing.join('\n')}`);
}

export function assertCrossSuiteFixtureConsistency() {
  const tiers = getTierMetadataFromFrames().map(({ tier }) => tier);
  const suites = Object.keys(FRAME_FAMILY_FIXTURES);
  tiers.forEach((tier) => {
    const keys = suites.map((suite) => Object.keys(FRAME_FAMILY_FIXTURES[suite][tier] || {}).sort().join(','));
    keys.forEach((keySet) => assert.equal(keySet, keys[0], `Cross-suite fixture mismatch for tier ${tier}`));
  });
}
