import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_DOCS = [
  'docs/rollback-runbook.md',
  'docs/disaster-recovery.md',
  'docs/data-retention.md',
  'docs/service-slos.md',
];

const MAX_STALENESS_DAYS = 180;
const now = new Date();
const errors = [];

for (const file of REQUIRED_DOCS) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required governance artifact: ${file}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const reviewedLine = content
    .split('\n')
    .find((line) => line.toLowerCase().includes('last reviewed'));

  if (!reviewedLine) {
    errors.push(`${file} missing Last Reviewed metadata line.`);
    continue;
  }

  const match = reviewedLine.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    errors.push(`${file} missing "Last Reviewed: YYYY-MM-DD" date value.`);
    continue;
  }

  const reviewedAt = new Date(`${match[1]}T00:00:00Z`);
  if (Number.isNaN(reviewedAt.getTime())) {
    errors.push(`${file} has invalid Last Reviewed date: ${match[1]}`);
    continue;
  }

  const ageDays = Math.floor((now - reviewedAt) / (1000 * 60 * 60 * 24));
  if (ageDays > MAX_STALENESS_DAYS) {
    errors.push(
      `${file} is stale (${ageDays} days old). Must be reviewed within ${MAX_STALENESS_DAYS} days.`
    );
  }
}

if (errors.length) {
  console.error('Governance artifact check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Governance artifact check passed. Required docs are present and fresh.');
