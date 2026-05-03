export function computeTierCoverageMetrics({ frames = [], frameTemplates = {}, tierNames = {}, minTemplateCoverage = 0.5 }) {
  const knownTierKeys = Object.keys(tierNames);
  const tierSet = new Set(knownTierKeys);

  const unknownTierKeys = [...new Set(frames.map((frame) => frame.tier).filter((tier) => !tierSet.has(tier)))];

  const allTierKeys = [...knownTierKeys, ...unknownTierKeys].sort();

  const byTier = allTierKeys.map((tier) => {
    const tierFrames = frames.filter((frame) => frame.tier === tier);
    const frameCount = tierFrames.length;
    const templateCount = tierFrames.filter((frame) => Boolean(frameTemplates?.[frame.id])).length;
    const layoutCount = new Set(tierFrames.map((frame) => frame.layout)).size;

    const templateCoverageRatio = frameCount > 0 ? templateCount / frameCount : 0;
    const layoutDiversityRatio = frameCount > 0 ? layoutCount / frameCount : 0;

    return {
      tier,
      tierName: tierNames[tier] || 'Unknown Tier',
      frameCount,
      templateCount,
      templateCoverageRatio,
      layoutCount,
      layoutDiversityRatio,
      isUnderCovered: frameCount > 0 && templateCoverageRatio < minTemplateCoverage,
    };
  });

  const orphanWarnings = [];

  byTier.forEach((row) => {
    if (row.frameCount === 0) {
      orphanWarnings.push(`Tier ${row.tier} (${row.tierName}) has no frames.`);
    }
  });

  if (unknownTierKeys.length > 0) {
    orphanWarnings.push(`Found frames assigned to unknown tiers: ${unknownTierKeys.join(', ')}.`);
  }

  return {
    totals: {
      tierCount: byTier.length,
      frameCount: frames.length,
      templateCount: Object.keys(frameTemplates || {}).length,
      orphanWarningCount: orphanWarnings.length,
    },
    byTier,
    orphanWarnings,
  };
}
