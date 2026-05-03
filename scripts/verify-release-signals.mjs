import fs from 'node:fs';

const required = [
  'tests',
  'coverage',
  'performance',
  'accessibility',
  'migrationChecks',
  'incidentLinks'
];

const signalFile = process.env.RELEASE_SIGNALS_FILE ?? '.github/release-checklist.json';
const sha = process.env.GITHUB_SHA ?? 'local';
const runId = process.env.GITHUB_RUN_ID ?? 'local-run';
const runNumber = process.env.GITHUB_RUN_NUMBER ?? '0';
const refName = process.env.GITHUB_REF_NAME ?? 'local';
const actor = process.env.GITHUB_ACTOR ?? 'local-user';

const raw = fs.readFileSync(signalFile, 'utf8');
const checklist = JSON.parse(raw);

const missing = required.filter((key) => !checklist?.signals?.[key]?.passed);
const missingEvidence = required.filter((key) => {
  const evidence = checklist?.signals?.[key]?.evidence;
  if (Array.isArray(evidence)) {
    return evidence.length === 0 || evidence.some((item) => !item);
  }
  return !evidence;
});

const result = {
  releasedAt: new Date().toISOString(),
  promoted: missing.length === 0 && missingEvidence.length === 0,
  buildMetadata: {
    sha,
    runId,
    runNumber,
    refName,
    actor
  },
  checklist
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/release-signoff.json', JSON.stringify(result, null, 2));

if (missing.length > 0 || missingEvidence.length > 0) {
  console.error('Release checklist verification failed.');
  if (missing.length > 0) {
    console.error(`Signals not passed: ${missing.join(', ')}`);
  }
  if (missingEvidence.length > 0) {
    console.error(`Signals missing evidence: ${missingEvidence.join(', ')}`);
  }
  process.exit(1);
}

console.log('Release checklist verification passed.');
