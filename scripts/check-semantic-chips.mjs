import { readFileSync } from 'node:fs';

const targets = [
  'src/pages/Library.jsx',
  'src/pages/Dashboard.jsx',
  'src/components/whizframe/FrameShell.jsx',
];

const bannedPatterns = [
  /tier-pill/g,
  /layout-badge/g,
  /wf-topic-tag[^\n]*style=\{\{/g,
];

let failed = false;
for (const file of targets) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of bannedPatterns) {
    if (pattern.test(text)) {
      console.error(`[semantic-chip] ${file}: found ad hoc chip style/token pattern ${pattern}`);
      failed = true;
    }
  }
}


const colorOnlyStatusChecks = [
  { file: 'src/components/whizframe/FrameShell.jsx', pattern: /riskAcc, background: `\$\{riskAcc\}18`[\s\S]{0,120}>\{layer\.risk/, message: 'TrustStack risk badge must use SemanticMarker text+shape marker.' },
  { file: 'src/components/whizframe/FrameShell.jsx', pattern: /SeverityDots/, message: 'Threat model must not rely on dots-only severity indicator.' },
];

for (const check of colorOnlyStatusChecks) {
  const text = readFileSync(check.file, 'utf8');
  if (check.pattern.test(text)) {
    console.error(`[semantic-chip] ${check.file}: ${check.message}`);
    failed = true;
  }
}


if (failed) process.exit(1);
console.log('[semantic-chip] compliance checks passed');
