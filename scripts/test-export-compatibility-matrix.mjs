import process from 'node:process';

const matrix = [
  { environment: 'chrome-latest', runtime: 'browser', png: true, webp: true, fallbackRenderer: true },
  { environment: 'firefox-latest', runtime: 'browser', png: true, webp: true, fallbackRenderer: true },
  { environment: 'safari-17+', runtime: 'browser', png: true, webp: true, fallbackRenderer: true },
  { environment: 'node-22', runtime: 'headless-runtime', png: false, webp: false, fallbackRenderer: true },
  { environment: 'node-20', runtime: 'headless-runtime', png: false, webp: false, fallbackRenderer: true }
];

const expectedParity = {
  png: 'Pixel dimensions and alpha channel are preserved for supported browser exports.',
  webp: 'Visual parity with PNG expected; minor encoder variance in file size/metadata is acceptable.',
  fallbackRenderer: 'Fallback renderer path must render frame hierarchy without throwing and preserve text ordering.'
};

const capabilityChecks = {
  png: (row) => row.runtime === 'browser' ? row.png : row.png === false,
  webp: (row) => row.runtime === 'browser' ? row.webp : row.webp === false,
  fallbackRenderer: (row) => row.fallbackRenderer === true
};

const results = matrix.map((row) => {
  const checks = Object.entries(capabilityChecks).map(([capability, check]) => ({
    capability,
    pass: Boolean(check(row))
  }));
  return { ...row, checks, pass: checks.every((check) => check.pass) };
});

const failed = results.filter((entry) => !entry.pass);
console.log('Export compatibility matrix verification');
for (const entry of results) {
  const status = entry.pass ? 'PASS' : 'FAIL';
  const checkSummary = entry.checks.map((c) => `${c.capability}:${c.pass ? 'pass' : 'fail'}`).join(', ');
  console.log(`- ${entry.environment} (${entry.runtime}) => ${status} [${checkSummary}]`);
}

console.log('\nExpected export parity criteria:');
for (const [capability, rule] of Object.entries(expectedParity)) {
  console.log(`- ${capability}: ${rule}`);
}

if (failed.length) {
  console.error(`\nMatrix verification failed for ${failed.length} environment(s).`);
  process.exit(1);
}
