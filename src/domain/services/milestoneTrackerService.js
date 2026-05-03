const TIER_NAMES = { A: 'Weekly Recaps', B: 'Project Deep-Dives', C: 'Comparative Tables', D: 'Risk & Explainers', E: 'Ecosystem Maps', F: 'Yield & Data', G: 'Macro & Thesis', H: 'Specialty' };

export const MILESTONE_THRESHOLDS = Object.freeze([
  { key: 'launch-5', label: 'Launch cadence', minPublished: 5, minTierCoverage: 2, minFrameFamilyCoverage: 3 },
  { key: 'system-12', label: 'System builder', minPublished: 12, minTierCoverage: 4, minFrameFamilyCoverage: 6 },
  { key: 'portfolio-25', label: 'Portfolio depth', minPublished: 25, minTierCoverage: 6, minFrameFamilyCoverage: 10 },
  { key: 'all-weather-40', label: 'All-weather desk', minPublished: 40, minTierCoverage: 8, minFrameFamilyCoverage: 14 },
]);

export function computeMilestoneProgress({ issues = [], frames = [] }) {
  const frameById = new Map(frames.map((frame) => [String(frame.id), frame]));
  const publishedIssues = issues.filter((issue) => issue?.status === 'published');
  const publishedCount = publishedIssues.length;
  const coveredTiers = new Set();
  const coveredFamilies = new Set();

  publishedIssues.forEach((issue) => {
    const frame = frameById.get(String(issue.frameId || ''));
    if (!frame) return;
    if (frame.tier) coveredTiers.add(frame.tier);
    if (frame.layout) coveredFamilies.add(frame.layout);
  });

  const current = MILESTONE_THRESHOLDS.find((m) => (
    publishedCount >= m.minPublished
    && coveredTiers.size >= m.minTierCoverage
    && coveredFamilies.size >= m.minFrameFamilyCoverage
  ));
  const currentIndex = current ? MILESTONE_THRESHOLDS.findIndex((m) => m.key === current.key) : -1;
  const next = MILESTONE_THRESHOLDS[currentIndex + 1] || MILESTONE_THRESHOLDS[0];

  const checklist = [
    { id: 'published', label: `Publish ${next.minPublished} total issues`, complete: publishedCount >= next.minPublished, remaining: Math.max(0, next.minPublished - publishedCount) },
    { id: 'tiers', label: `Cover ${next.minTierCoverage} tiers`, complete: coveredTiers.size >= next.minTierCoverage, remaining: Math.max(0, next.minTierCoverage - coveredTiers.size) },
    { id: 'families', label: `Use ${next.minFrameFamilyCoverage} frame families`, complete: coveredFamilies.size >= next.minFrameFamilyCoverage, remaining: Math.max(0, next.minFrameFamilyCoverage - coveredFamilies.size) },
  ];

  const progress = checklist.reduce((acc, item) => acc + (item.complete ? 1 : 0), 0) / checklist.length;

  const missingTierEntries = Object.entries(TIER_NAMES).filter(([tier]) => !coveredTiers.has(tier));
  const guidance = [];
  if (missingTierEntries.length > 0) {
    guidance.push(`Diversify tier coverage: next missing tiers are ${missingTierEntries.slice(0, 3).map(([tier, name]) => `${tier} (${name})`).join(', ')}.`);
  }
  if (coveredFamilies.size < next.minFrameFamilyCoverage) {
    guidance.push(`Add ${next.minFrameFamilyCoverage - coveredFamilies.size} more frame family${next.minFrameFamilyCoverage - coveredFamilies.size === 1 ? '' : 'ies'} to reduce layout concentration.`);
  }

  return {
    publishedCount,
    coveredTierCount: coveredTiers.size,
    coveredFrameFamilyCount: coveredFamilies.size,
    coveredTiers: [...coveredTiers],
    coveredFrameFamilies: [...coveredFamilies],
    currentMilestone: current,
    nextMilestone: next,
    checklist,
    progress,
    guidance,
  };
}

export function computeMilestoneUnlockEvents({ progress, alreadyFired = [] }) {
  const fired = new Set(alreadyFired);
  const events = [];
  MILESTONE_THRESHOLDS.forEach((milestone) => {
    const unlocked = progress.publishedCount >= milestone.minPublished
      && progress.coveredTierCount >= milestone.minTierCoverage
      && progress.coveredFrameFamilyCount >= milestone.minFrameFamilyCoverage;
    if (!unlocked || fired.has(milestone.key)) return;
    fired.add(milestone.key);
    events.push({ event: 'milestone.unlocked', key: milestone.key, label: milestone.label });
  });
  return { events, firedMilestones: [...fired] };
}
