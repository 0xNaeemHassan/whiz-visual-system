import fs from 'fs';

const targets = [
  { family: 'table', marker: 'No table data yet' },
  { family: 'grid', marker: 'No grid items yet' },
  { family: 'timeline', marker: 'No timeline events yet' },
  { family: 'network', marker: 'Network failed to load' },
  { family: 'library-filtered', marker: 'No frames match current filters' },
  { family: 'library-failed', marker: 'Failed to load frames' },
];

const shell = fs.readFileSync('src/components/whizframe/FrameShell.jsx', 'utf8');
const library = fs.readFileSync('src/pages/Library.jsx', 'utf8');

const snapshot = targets.map((t) => ({
  ...t,
  present: (shell.includes(t.marker) || library.includes(t.marker)),
}));

const missing = snapshot.filter((s) => !s.present);
console.log('Empty-state snapshot:', JSON.stringify(snapshot, null, 2));
if (missing.length) {
  console.error('Missing markers:', missing.map((m) => m.family).join(', '));
  process.exit(1);
}
