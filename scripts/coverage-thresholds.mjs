import fs from 'node:fs';
import path from 'node:path';

const COVERAGE_DIR = path.resolve('.coverage', 'v8');
const THRESHOLDS_PATH = path.resolve('config', 'coverage-thresholds.json');

function listCoverageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => path.join(dir, name));
}

function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function spanLength(ranges) {
  return ranges.reduce((sum, range) => sum + Math.max(0, range.end - range.start), 0);
}

function toRelative(fileUrlOrPath) {
  const cleaned = fileUrlOrPath.startsWith('file://') ? new URL(fileUrlOrPath) : fileUrlOrPath;
  const filePath = typeof cleaned === 'string' ? cleaned : cleaned.pathname;
  return path.relative(process.cwd(), filePath);
}

function matchesTier(filePath, tier) {
  return tier.patterns.some((segment) => filePath.includes(segment));
}

function loadThresholds() {
  return JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8'));
}

function analyze() {
  const thresholds = loadThresholds();
  const files = listCoverageFiles(COVERAGE_DIR);
  if (!files.length) {
    throw new Error(`No V8 coverage files found in ${COVERAGE_DIR}. Run coverage collection first.`);
  }

  const totalsByFile = new Map();

  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const result of payload.result ?? []) {
      const rel = toRelative(result.url);
      if (!rel.startsWith('src/')) continue;
      if (!/\.(js|jsx|ts|tsx)$/.test(rel)) continue;

      const allRanges = [];
      const coveredRanges = [];
      for (const fn of result.functions ?? []) {
        for (const range of fn.ranges ?? []) {
          const normalized = { start: range.startOffset, end: range.endOffset };
          allRanges.push(normalized);
          if (range.count > 0) coveredRanges.push(normalized);
        }
      }

      const total = spanLength(mergeRanges(allRanges));
      const covered = spanLength(mergeRanges(coveredRanges));
      const existing = totalsByFile.get(rel) ?? { total: 0, covered: 0 };
      existing.total = Math.max(existing.total, total);
      existing.covered = Math.max(existing.covered, covered);
      totalsByFile.set(rel, existing);
    }
  }

  const tierResults = thresholds.tiers.map((tier) => {
    let total = 0;
    let covered = 0;
    for (const [filePath, stats] of totalsByFile.entries()) {
      if (matchesTier(filePath, tier)) {
        total += stats.total;
        covered += stats.covered;
      }
    }
    const coverage = total === 0 ? 100 : (covered / total) * 100;
    return { ...tier, total, covered, coverage };
  });

  const failures = tierResults.filter((tier) => tier.coverage < tier.minimumCoverage);

  for (const tier of tierResults) {
    console.log(`${tier.name}: ${tier.coverage.toFixed(2)}% (minimum ${tier.minimumCoverage}%)`);
  }

  if (failures.length) {
    const reason = failures.map((tier) => `${tier.name} ${tier.coverage.toFixed(2)}% < ${tier.minimumCoverage}%`).join('; ');
    throw new Error(`Coverage threshold breach: ${reason}`);
  }
}

analyze();
