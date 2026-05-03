import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaPath = path.join(root, 'docs/config/taxonomy.schema.json');
const prTemplatePath = path.join(root, '.github/PULL_REQUEST_TEMPLATE.md');
const incidentTemplatePath = path.join(root, '.github/ISSUE_TEMPLATE/incident_report.yml');
const releaseNotesPath = path.join(root, 'docs/release-notes/unreleased.md');
const incidentReportsDir = path.join(root, 'docs/incidents/reports');

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
};

if (!existsSync(schemaPath)) {
  fail('Missing docs/config/taxonomy.schema.json');
  process.exit(process.exitCode ?? 1);
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const enums = {
  type: schema.properties.type.enum,
  severity: schema.properties.severity.enum,
  area: schema.properties.area.enum,
  customerImpact: schema.properties.customerImpact.enum,
};

const prTemplate = readFileSync(prTemplatePath, 'utf8');
const requiredPrFields = ['type:', 'severity:', 'area:', 'regression:', 'customerImpact:'];
for (const field of requiredPrFields) {
  if (!prTemplate.includes(field)) {
    fail(`PR template missing taxonomy field '${field}'`);
  }
}

const issueTemplate = readFileSync(incidentTemplatePath, 'utf8');
for (const value of enums.severity) if (!issueTemplate.includes(`- ${value}`)) fail(`Incident issue template missing severity option '${value}'`);
for (const value of enums.area) if (!issueTemplate.includes(`- ${value}`)) fail(`Incident issue template missing area option '${value}'`);
for (const value of enums.customerImpact) if (!issueTemplate.includes(`- ${value}`)) fail(`Incident issue template missing customer impact option '${value}'`);
if (!issueTemplate.includes('- incident')) fail("Incident issue template must constrain 'type' to incident");

const releaseNotes = readFileSync(releaseNotesPath, 'utf8');
const taggedLinePattern = /^- \[type:[^\]]+\]\[severity:[^\]]+\]\[area:[^\]]+\]\[regression:(true|false)\]\[customer-impact:[^\]]+\] .+/m;
if (!taggedLinePattern.test(releaseNotes)) {
  fail('Release notes must include at least one taxonomy-tagged entry');
}

const reports = readdirSync(incidentReportsDir).filter((f) => f.endsWith('.md'));
for (const reportFile of reports) {
  if (reportFile === 'TEMPLATE.md') continue;
  const contents = readFileSync(path.join(incidentReportsDir, reportFile), 'utf8');
  const fm = contents.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    fail(`Incident report ${reportFile} missing frontmatter`);
    continue;
  }
  const frontmatter = fm[1];
  for (const key of ['type', 'severity', 'area', 'regression', 'customerImpact']) {
    if (!new RegExp(`^${key}:`, 'm').test(frontmatter)) {
      fail(`Incident report ${reportFile} missing frontmatter key '${key}'`);
    }
  }
}

if (!process.exitCode) {
  console.log('✅ Taxonomy conformance checks passed.');
}
