export const CONTINUITY_STATUS = {
  healthy: 'healthy',
  missing_part: 'missing_part',
  duplicate_part: 'duplicate_part',
  branch_blocked: 'branch_blocked',
};

export function normalizeSeriesModel(issue = {}) {
  return {
    ...issue,
    series_id: String(issue.series_id || '').trim(),
    part_number: Number.isFinite(Number(issue.part_number)) ? Number(issue.part_number) : null,
    prev_issue: String(issue.prev_issue || '').trim(),
    next_issue: String(issue.next_issue || '').trim(),
    continuity_status: String(issue.continuity_status || '').trim() || CONTINUITY_STATUS.healthy,
  };
}

export function getSeriesIssues(issues = [], seriesId = '') {
  return issues
    .map(normalizeSeriesModel)
    .filter((issue) => issue.series_id && issue.series_id === seriesId)
    .sort((a, b) => (a.part_number || 0) - (b.part_number || 0));
}

export function suggestNextPart(baseIssue, issues = []) {
  const normalizedBase = normalizeSeriesModel(baseIssue);
  const seriesId = normalizedBase.series_id;
  if (!seriesId) return null;
  const seriesIssues = getSeriesIssues(issues, seriesId);
  const highestPart = seriesIssues.reduce((max, issue) => Math.max(max, issue.part_number || 0), 0);
  const partNumber = Math.max(highestPart + 1, 1);
  const previousIssue = seriesIssues.find((issue) => issue.part_number === partNumber - 1);
  const inheritFrom = previousIssue || normalizedBase;
  return {
    series_id: seriesId,
    part_number: partNumber,
    prev_issue: previousIssue?.id || '',
    next_issue: '',
    continuity_status: CONTINUITY_STATUS.healthy,
    frameId: inheritFrom.frameId || '',
    themeId: inheritFrom.themeId || '',
    topicTag: inheritFrom.topicTag || '',
  };
}

export function analyzeSeriesIntegrity(issues = []) {
  const bySeries = issues.map(normalizeSeriesModel).reduce((acc, issue) => {
    if (!issue.series_id) return acc;
    acc[issue.series_id] = acc[issue.series_id] || [];
    acc[issue.series_id].push(issue);
    return acc;
  }, {});
  return Object.entries(bySeries).map(([seriesId, seriesIssues]) => {
    const sorted = [...seriesIssues].sort((a, b) => (a.part_number || 0) - (b.part_number || 0));
    const seen = new Set();
    const duplicateParts = [];
    const missingParts = [];
    let maxPart = 0;
    for (const issue of sorted) {
      const part = issue.part_number || 0;
      maxPart = Math.max(maxPart, part);
      if (seen.has(part)) duplicateParts.push(part);
      seen.add(part);
    }
    for (let part = 1; part <= maxPart; part += 1) {
      if (!seen.has(part)) missingParts.push(part);
    }
    const blockedBranches = sorted.filter((issue) => issue.prev_issue && !seriesIssues.some((candidate) => candidate.id === issue.prev_issue));
    return {
      seriesId,
      issues: sorted,
      duplicateParts,
      missingParts,
      blockedBranches,
      status: duplicateParts.length ? CONTINUITY_STATUS.duplicate_part : missingParts.length ? CONTINUITY_STATUS.missing_part : blockedBranches.length ? CONTINUITY_STATUS.branch_blocked : CONTINUITY_STATUS.healthy,
    };
  });
}
