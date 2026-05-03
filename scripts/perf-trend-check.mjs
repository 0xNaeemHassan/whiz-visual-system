#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';

const BASELINE_FILE = process.env.PERF_TREND_BASELINE_FILE || 'config/perf-trend-baseline.json';
const RESULTS_FILE = process.env.PERF_TREND_RESULTS_FILE || 'artifacts/perf-trends.json';
const SAMPLE_COUNT = Number(process.env.PERF_SAMPLE_COUNT || 15);

if (!existsSync(BASELINE_FILE)) {
  console.error(`❌ Trend baseline file not found: ${BASELINE_FILE}`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));

function nowIso() {
  return new Date().toISOString();
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function median(values) {
  return percentile(values, 50);
}

function runSamples(operation) {
  const samples = [];
  for (let i = 0; i < SAMPLE_COUNT; i += 1) {
    const t0 = performance.now();
    operation();
    samples.push(performance.now() - t0);
  }
  return samples;
}

function renderSyntheticWorkload() {
  const vertices = new Float64Array(50_000);
  for (let i = 0; i < vertices.length; i += 1) {
    vertices[i] = Math.sin(i / 7) * Math.cos(i / 13) * ((i % 360) / 180);
  }
  let luminance = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    luminance += Math.abs(vertices[i]);
  }
  return luminance;
}

function editorMutationSyntheticWorkload() {
  const blocks = Array.from({ length: 8_000 }, (_, i) => ({
    id: `block-${i}`,
    x: i % 200,
    y: Math.floor(i / 200),
    content: `Layer ${i}`
  }));

  for (let i = 0; i < blocks.length; i += 7) {
    blocks[i].x += 3;
    blocks[i].y += 2;
    blocks[i].content = `${blocks[i].content}*`;
  }

  blocks.sort((a, b) => a.y - b.y || a.x - b.x);
  return blocks.length;
}

function exportSyntheticWorkload() {
  const payload = [];
  for (let i = 0; i < 2_500; i += 1) {
    payload.push({
      id: i,
      type: i % 2 ? 'shape' : 'text',
      style: {
        color: `hsl(${i % 360}, 65%, 50%)`,
        opacity: ((i % 10) + 1) / 10
      },
      points: [i, i + 1, i + 2, i + 3]
    });
  }

  const json = JSON.stringify({ name: 'synthetic-export', payload });
  return Buffer.byteLength(json);
}

const workloads = [
  ['render', renderSyntheticWorkload],
  ['editorMutations', editorMutationSyntheticWorkload],
  ['export', exportSyntheticWorkload]
];

const operationResults = {};
let hasRegression = false;

for (const [name, workload] of workloads) {
  const samples = runSamples(workload);
  const p95 = Number(percentile(samples, 95).toFixed(3));
  const med = Number(median(samples).toFixed(3));
  const mean = Number((samples.reduce((sum, v) => sum + v, 0) / samples.length).toFixed(3));

  const base = baseline.operations[name];
  const deltaPercent = Number((((p95 - base.baselineP95Ms) / base.baselineP95Ms) * 100).toFixed(2));
  const pass = deltaPercent <= base.maxRegressionPercent;

  operationResults[name] = {
    samples,
    medianMs: med,
    meanMs: mean,
    p95Ms: p95,
    baselineP95Ms: base.baselineP95Ms,
    maxRegressionPercent: base.maxRegressionPercent,
    deltaPercent,
    pass
  };

  const icon = pass ? '✅' : '❌';
  console.log(
    `${icon} ${name}: p95=${p95}ms baseline=${base.baselineP95Ms}ms delta=${deltaPercent}% limit=${base.maxRegressionPercent}%`
  );

  if (!pass) hasRegression = true;
}

const resultRecord = {
  schemaVersion: 1,
  generatedAt: nowIso(),
  sampleCount: SAMPLE_COUNT,
  operations: operationResults
};

let history = { schemaVersion: 1, generatedAt: nowIso(), runs: [] };
if (existsSync(RESULTS_FILE)) {
  history = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
}

history.schemaVersion = 1;
history.generatedAt = nowIso();
history.runs = [...(history.runs ?? []), resultRecord].slice(-100);

mkdirSync(dirname(RESULTS_FILE), { recursive: true });
writeFileSync(RESULTS_FILE, `${JSON.stringify(history, null, 2)}\n`);

if (hasRegression) {
  console.error('❌ Trend-based performance regression detected.');
  process.exit(1);
}

console.log(`✅ Trend results saved to ${RESULTS_FILE}`);
