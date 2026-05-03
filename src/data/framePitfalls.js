export const FRAME_PITFALLS = Object.freeze({
  4: [
    {
      id: 'ticker-column-contract',
      severity: 'high',
      warning: 'Ticker content drifts from TICKER/EVENT/TIME/IMPACT pattern and becomes unreadable.',
      triggerHint: 'Keep items in 4 short chunks and cap each chunk near 28 characters.',
    },
  ],
  8: [
    {
      id: 'memo-overload',
      severity: 'medium',
      warning: 'Investment memo loses hierarchy when pull quote and key stats are both dense.',
      triggerHint: 'Use a single quote line and limit stats to 4 concise values.',
    },
  ],
  13: [
    {
      id: 'bull-bear-imbalance',
      severity: 'high',
      warning: 'Bull/Bear layout feels biased when one side has more than 3 bullets.',
      triggerHint: 'Keep both sides at exactly 3 bullets with parallel sentence length.',
    },
  ],
  21: [
    {
      id: 'tier-row-mismatch',
      severity: 'high',
      warning: 'Tier list becomes misleading when row labels do not map S/A/B/C/D correctly.',
      triggerHint: 'Ensure each row col2 includes only one of: S, A, B, C, D.',
    },
  ],
  25: [
    {
      id: 'postmortem-missing-lesson',
      severity: 'medium',
      warning: 'Postmortem row loses narrative if lesson column is generic or empty.',
      triggerHint: 'Populate col4 with a concrete lesson statement under 60 characters.',
    },
  ],
  42: [
    {
      id: 'longform-wall-of-text',
      severity: 'high',
      warning: 'Long-form frame turns into a wall of text and breaks scanability.',
      triggerHint: 'Split body into exactly 3 paragraphs separated by double newline.',
    },
  ],
  49: [
    {
      id: 'benefit-risk-mislabel',
      severity: 'high',
      warning: 'Cost-benefit matrix is ambiguous when col4 values are inconsistent.',
      triggerHint: 'Use only "benefit" or "risk" in col4 for every row.',
    },
  ],
  50: [
    {
      id: 'volume-headline-conflict',
      severity: 'medium',
      warning: 'Quarterly frame weakens when volume label and headline point to different periods.',
      triggerHint: 'Keep one volume marker and one quarter-specific headline.',
    },
  ],
});

export function getFramePitfalls(frameId) {
  return FRAME_PITFALLS[frameId] || [];
}
