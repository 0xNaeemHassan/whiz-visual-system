const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function uniqueRatio(values = []) {
  if (!values.length) return 0;
  const unique = new Set(values.filter(Boolean).map((value) => String(value)));
  return unique.size / values.length;
}

export function evaluatePlannerScore(issues = [], nowDate = new Date()) {
  const now = parseDate(nowDate) || new Date();
  const datedIssues = issues
    .map((issue) => ({ ...issue, parsedDate: parseDate(issue.publishDate) }))
    .filter((issue) => issue.parsedDate)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  const cadenceWindow = [];
  for (let i = 1; i < datedIssues.length; i += 1) {
    const gap = (datedIssues[i].parsedDate - datedIssues[i - 1].parsedDate) / DAY_MS;
    cadenceWindow.push(Math.max(0, gap));
  }
  const cadenceAverage = cadenceWindow.length ? cadenceWindow.reduce((a, b) => a + b, 0) / cadenceWindow.length : 0;
  const cadenceVariance = cadenceWindow.length ? cadenceWindow.reduce((sum, g) => sum + Math.abs(g - cadenceAverage), 0) / cadenceWindow.length : 0;
  const cadenceAdherence = cadenceWindow.length ? clamp(100 - cadenceVariance * 4) : 50;

  const topicDiversity = clamp(uniqueRatio(issues.map((issue) => issue.topic?.trim().toLowerCase())) * 100);
  const frameDiversity = clamp(uniqueRatio(issues.map((issue) => issue.frameId)) * 100);

  const provenanceAges = issues
    .flatMap((issue) => Array.isArray(issue.metricProvenance) ? issue.metricProvenance : [])
    .map((entry) => {
      const match = String(entry).match(/(\d{4}-\d{2}-\d{2})/);
      if (!match) return null;
      const parsed = parseDate(match[1]);
      if (!parsed) return null;
      return Math.max(0, (now - parsed) / DAY_MS);
    })
    .filter((age) => age != null);
  const avgAge = provenanceAges.length ? provenanceAges.reduce((a, b) => a + b, 0) / provenanceAges.length : 90;
  const verificationFreshness = clamp(100 - avgAge * 1.4);

  const statusCounts = issues.reduce((acc, issue) => {
    const key = issue.status || 'draft';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const counts = Object.values(statusCounts);
  const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const imbalance = counts.length ? counts.reduce((sum, count) => sum + Math.abs(count - mean), 0) / counts.length : 1;
  const workloadBalance = counts.length ? clamp(100 - imbalance * 20) : 50;

  const breakdown = {
    cadenceAdherence: Number(cadenceAdherence.toFixed(2)),
    topicDiversity: Number(topicDiversity.toFixed(2)),
    frameDiversity: Number(frameDiversity.toFixed(2)),
    verificationFreshness: Number(verificationFreshness.toFixed(2)),
    workloadBalance: Number(workloadBalance.toFixed(2)),
  };

  const aggregateScore = Number((Object.values(breakdown).reduce((sum, value) => sum + value, 0) / Object.keys(breakdown).length).toFixed(2));
  const weakest = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0] || ['cadenceAdherence', 0];

  const recommendations = {
    cadenceAdherence: 'Normalize publishing intervals by queuing buffer posts for long gap weeks.',
    topicDiversity: 'Rotate topics with a weekly pillar checklist to avoid repetition.',
    frameDiversity: 'Schedule alternate frame templates for the next three planned issues.',
    verificationFreshness: 'Refresh metric sources and provenance links for aging claims before publish.',
    workloadBalance: 'Redistribute issues across statuses so planned/wip/done stay within a narrow band.',
  };

  return {
    aggregateScore,
    breakdown,
    weakestSubmetric: weakest[0],
    weakestScore: weakest[1],
    recommendation: recommendations[weakest[0]],
  };
}

export function classifyScore(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}
