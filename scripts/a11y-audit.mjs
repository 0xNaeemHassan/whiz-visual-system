import assert from 'node:assert/strict';
import fs from 'node:fs';

const CRITICAL_FILES = [
  'src/App.jsx',
  'src/pages/Editor.jsx',
  'src/pages/Planner.jsx',
  'src/pages/Dashboard.jsx',
  'src/components/Sidebar.jsx',
  'src/components/TopBar.jsx',
  'src/components/ReadinessChecklist.jsx',
  'src/components/PatternSelector.jsx',
  'src/components/ImageUpload.jsx',
  'src/index.css',
];

const report = {
  generatedAt: new Date().toISOString(),
  checks: [],
  failures: [],
  warnings: [],
};

function recordCheck(name, passed, details, severity = 'critical') {
  report.checks.push({ name, passed, details, severity });
  if (!passed) {
    if (severity === 'critical') report.failures.push({ name, details });
    else report.warnings.push({ name, details });
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const sourceByFile = Object.fromEntries(CRITICAL_FILES.map((file) => [file, read(file)]));

const appSource = sourceByFile['src/App.jsx'];
const routerSource = read('src/router/hashRouter.js');
recordCheck('Critical routes are present for dashboard/editor/planner/library/docs',
  /['"]\/['"]/.test(routerSource) && /editor/.test(routerSource) && /planner/.test(routerSource) && /library/.test(routerSource) && /docs/.test(routerSource),
  'Route coverage should include critical pages.');

recordCheck('Landmark usage is present in root layout',
  /<main\b/.test(appSource) || /role="main"/.test(appSource),
  'App shell should expose a main landmark.');

const css = sourceByFile['src/index.css'];
recordCheck('Focus-visible styling exists globally',
  /:focus-visible/.test(css) && /--focus-ring-color/.test(css),
  'Global focus ring tokens and :focus-visible styles are required.');

recordCheck('Color contrast auditing hooks remain in repository',
  fs.existsSync('scripts/lint-contrast-font-policy.mjs') && fs.existsSync('docs/accessibility-control-inventory.md'),
  'Contrast tooling/docs must exist for compliance review.');

for (const [file, source] of Object.entries(sourceByFile)) {
  if (!file.endsWith('.jsx')) continue;

  const keyboardHandlers = source.match(/onKeyDown=|onKeyUp=|onKeyPress=/g)?.length ?? 0;
  const pointerHandlers = source.match(/onClick=|onMouseDown=|onPointerDown=/g)?.length ?? 0;
  if (pointerHandlers > 0) {
    recordCheck(`${file}: pointer interactions have keyboard semantics`,
      keyboardHandlers > 0 || /button|aria-/.test(source),
      'Interactive components should support keyboard semantics.');
  }

  const dialogOpeners = source.match(/setShow[A-Za-z]+\(true\)/g) ?? [];
  if (dialogOpeners.length) {
    recordCheck(`${file}: modal/overlay close path exists`,
      /setShow[A-Za-z]+\(false\)/.test(source) || /Escape/.test(source),
      'Components opening overlays must include explicit close or Escape handling.');
  }

  const controls = [...source.matchAll(/<(input|select|textarea)\b[^>]*>/g)];
  const unlabeled = controls.filter(([snippet]) => !/type\s*=\s*"hidden"/.test(snippet) && !/type\s*=\s*"file"/.test(snippet))
    .filter(([snippet]) => !/\bid\s*=/.test(snippet) && !/aria-label\s*=/.test(snippet) && !/aria-labelledby\s*=/.test(snippet));
  recordCheck(`${file}: form controls have programmatic labels`, unlabeled.length === 0, `Unlabeled controls: ${unlabeled.length}`, 'warning');
}

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/a11y-report.json', JSON.stringify(report, null, 2));

const md = [
  '# Accessibility Audit Report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `- Checks run: ${report.checks.length}`,
  `- Critical failures: ${report.failures.length}`,
  `- Warnings: ${report.warnings.length}`,
  '',
  '## Checks',
  ...report.checks.map((check) => `- [${check.passed ? 'x' : ' '}] (${check.severity}) ${check.name} — ${check.details}`),
].join('\n');
fs.writeFileSync('reports/a11y-report.md', md);

assert.equal(report.failures.length, 0, `Accessibility gate failed with ${report.failures.length} failure(s). See reports/a11y-report.md`);
console.log('Accessibility gate passed. Reports published to reports/a11y-report.{json,md}');
