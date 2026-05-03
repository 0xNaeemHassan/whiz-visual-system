import fs from 'node:fs';
import path from 'node:path';

const roots = ['src'];
const blockedPatterns = [
  { regex: /dangerouslySetInnerHTML/g, message: 'dangerouslySetInnerHTML is forbidden.' },
  { regex: /\binnerHTML\s*=/g, message: 'innerHTML assignment is forbidden.' },
  { regex: /insertAdjacentHTML\s*\(/g, message: 'insertAdjacentHTML is forbidden.' },
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx|mjs)$/.test(entry.name) && !/\.test\.(js|jsx|ts|tsx|mjs)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const pattern of blockedPatterns) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(text)) findings.push({ file: full, message: pattern.message });
      }
    }
  }
}

for (const root of roots) if (fs.existsSync(root)) walk(root);

if (findings.length) {
  console.error('XSS pattern check failed:');
  findings.forEach((f) => console.error(`- ${f.file}: ${f.message}`));
  process.exit(1);
}

console.log('XSS pattern check passed.');
