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

if (failed) process.exit(1);
console.log('[semantic-chip] compliance checks passed');
