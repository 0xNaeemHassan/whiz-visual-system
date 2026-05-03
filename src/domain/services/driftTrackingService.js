const DAY_MS = 1000 * 60 * 60 * 24;

const severityForScore = (score) => {
  if (score >= 14) return 'critical';
  if (score >= 7) return 'warn';
  return 'info';
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function computeIssueDrift(issue = {}, now = new Date()) {
  const publishDate = normalizeDate(issue.publishDate);
  const createdAtDate = normalizeDate(issue.createdAt);
  const replanCount = Number(issue.replanCount || 0);
  const rescheduleCount = Number(issue.rescheduleCount || 0);
  const verificationState = issue.verificationState || ((issue.sourceLinks || '').trim() ? 'verified' : 'missing');
  const topicConfidence = issue.confidence || 'medium';

  const dayDelta = publishDate ? Math.ceil((publishDate - now) / DAY_MS) : 0;
  const timingScore = publishDate ? Math.abs(dayDelta) : 0;
  const timingDrift = {
    score: timingScore,
    severity: severityForScore(timingScore),
    summary: publishDate ? `${dayDelta}d to publish` : 'No publish date',
  };

  const topicScore = topicConfidence === 'low' ? 10 : topicConfidence === 'medium' ? 4 : 0;
  const topicDrift = {
    score: topicScore,
    severity: severityForScore(topicScore),
    summary: `Confidence ${topicConfidence}`,
  };

  const frameScore = (replanCount * 3) + (issue.frameId ? 0 : 5);
  const frameDrift = {
    score: frameScore,
    severity: severityForScore(frameScore),
    summary: `Replans ${replanCount}`,
  };

  const verificationScore = verificationState === 'verified' ? 0 : verificationState === 'pending' ? 6 : 12;
  const verificationDrift = {
    score: verificationScore,
    severity: severityForScore(verificationScore),
    summary: `Verification ${verificationState}`,
  };

  const total = timingScore + topicScore + frameScore + verificationScore + (rescheduleCount * 2);
  return {
    createdAtDate,
    total,
    drift: { timing: timingDrift, topic: topicDrift, frame: frameDrift, verification: verificationDrift },
  };
}

export function computeWeeklyDriftSummary(issues = [], now = new Date()) {
  const weekAgo = new Date(now.getTime() - (7 * DAY_MS));
  const scored = issues.map((issue) => ({ issue, ...computeIssueDrift(issue, now) }));
  const weekly = scored.filter(({ issue, createdAtDate }) => {
    const changedAt = normalizeDate(issue.lastReplannedAt || issue.lastRescheduledAt || issue.updatedAt) || createdAtDate;
    return changedAt ? changedAt >= weekAgo : true;
  });

  const byType = ['timing', 'topic', 'frame', 'verification'].reduce((acc, type) => {
    const avg = weekly.length ? weekly.reduce((sum, row) => sum + row.drift[type].score, 0) / weekly.length : 0;
    acc[type] = Math.round(avg * 10) / 10;
    return acc;
  }, {});

  const remediationActions = [];
  if (byType.timing >= 7) remediationActions.push('Run schedule cleanup and pull overdue planned posts into next two slots.');
  if (byType.topic >= 7) remediationActions.push('Refresh low-confidence topics with new evidence before production.');
  if (byType.frame >= 7) remediationActions.push('Lock frame briefs earlier to reduce replan churn.');
  if (byType.verification >= 7) remediationActions.push('Open verification queue and resolve missing or pending source links.');
  if (remediationActions.length === 0) remediationActions.push('Drift is controlled this week; keep current cadence and verification process.');

  const breaches = weekly.flatMap(({ issue, drift }) =>
    Object.entries(drift)
      .filter(([, value]) => value.score >= 14)
      .map(([type, value]) => ({ id: issue.id, issueNum: issue.issueNum, topic: issue.topic, type, score: value.score }))
  );

  return { weeklyCount: weekly.length, byType, remediationActions, breaches, scored };
}
