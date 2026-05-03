#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { performance } from 'node:perf_hooks';

const BUDGET_FILE = process.env.PERF_BUDGET_FILE || 'config/perf-budgets.json';
const DIST_DIR = process.env.PERF_DIST_DIR || 'dist';

if (!existsSync(BUDGET_FILE)) {
  console.error(`❌ Budget file not found: ${BUDGET_FILE}`);
  process.exit(1);
}

const budgets = JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));

function applyTolerance(limit) {
  const tolerance = Number(budgets.tolerancePercent ?? 0);
  return Math.floor(limit * (1 + tolerance / 100));
}

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return [fullPath];
  });
}

function sumFileBytes(files, extensionFilter = null) {
  return files
    .filter((file) => !extensionFilter || extname(file) === extensionFilter)
    .reduce((sum, file) => sum + statSync(file).size, 0);
}

const start = performance.now();
const buildResult = spawnSync('npm', ['run', 'build', '--silent'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
const durationMs = Math.round(performance.now() - start);

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

if (!existsSync(DIST_DIR)) {
  console.error(`❌ Build output directory not found: ${DIST_DIR}`);
  process.exit(1);
}

const files = collectFiles(DIST_DIR);
const totalBytes = sumFileBytes(files);
const jsBytes = sumFileBytes(files, '.js');
const cssBytes = sumFileBytes(files, '.css');

const checks = [
  ['build.maxDurationMs', durationMs, applyTolerance(budgets.build.maxDurationMs), 'ms'],
  ['bundle.maxTotalBytes', totalBytes, applyTolerance(budgets.bundle.maxTotalBytes), 'bytes'],
  ['bundle.maxJsBytes', jsBytes, applyTolerance(budgets.bundle.maxJsBytes), 'bytes'],
  ['bundle.maxCssBytes', cssBytes, applyTolerance(budgets.bundle.maxCssBytes), 'bytes']
];

let hasFailures = false;
for (const [name, actual, maxAllowed, unit] of checks) {
  const pass = actual <= maxAllowed;
  const status = pass ? '✅' : '❌';
  console.log(`${status} ${name}: actual=${actual}${unit} limit=${maxAllowed}${unit}`);
  if (!pass) hasFailures = true;
}

if (hasFailures) {
  console.error('❌ Performance smoke check failed: one or more budgets exceeded.');
  process.exit(1);
}

console.log('✅ Performance smoke check passed.');
