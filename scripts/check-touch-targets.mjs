import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

const checks = [
  { name: '--touch-target-min token', pattern: /--touch-target-min:\s*44px\s*;/ },
  { name: '.touch-target utility', pattern: /\.touch-target\s*\{[^}]*min-width:\s*var\(--touch-target-min\);[^}]*min-height:\s*var\(--touch-target-min\);[^}]*\}/s },
  { name: '.btn minimum touch height', pattern: /\.btn\s*\{[^}]*min-height:\s*var\(--touch-target-min\);[^}]*\}/s },
  { name: '.sidebar-item minimum touch height', pattern: /\.sidebar-item\s*\{[^}]*min-height:\s*var\(--touch-target-min\);[^}]*\}/s },
  { name: '.topbar-actions grouped spacing', pattern: /\.topbar-actions\s*\{[^}]*gap:\s*var\(--touch-gap-min\);[^}]*\}/s },
];

const failures = checks.filter((check) => !check.pattern.test(css));

if (failures.length) {
  console.error('Touch target style checks failed:');
  failures.forEach((f) => console.error(`- ${f.name}`));
  process.exit(1);
}

console.log('Touch target style checks passed.');
