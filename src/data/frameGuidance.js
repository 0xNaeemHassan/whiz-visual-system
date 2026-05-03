import { FRAMES } from './frames';

const BASE_GUIDANCE = Object.freeze({
  bestUseCases: ['Weekly/milestone recap content', 'Structured insights with clear sections'],
  antiPatterns: ['Mixing unrelated metrics in one frame', 'Overstuffing with dense copy'],
  whenNotToUse: ['No clear narrative or dataset is available', 'You need real-time/live updating data'],
});

const FRAME_GUIDANCE_OVERRIDES = {
  4: {
    bestUseCases: ['Weekly yield/data snapshots', 'Monospace comparisons across multiple events'],
    antiPatterns: ['Using free-form paragraphs inside table rows', 'Leaving impact/severity columns unnormalized'],
    whenNotToUse: ['You need visual storytelling over tabular precision', 'You only have one or two data points'],
  },
  8: {
    bestUseCases: ['Investment memo-style project profiles', 'Thesis + 4 KPI snapshots with one pull quote'],
    antiPatterns: ['Turning it into a pure announcement graphic', 'Using too many stat tiles beyond the core four'],
    whenNotToUse: ['You lack enough evidence for a thesis', 'You need a quick, lightweight weekly recap'],
  },
  13: {
    bestUseCases: ['Balanced bull/bear breakdowns', 'Opinion pieces ending with a clear call'],
    antiPatterns: ['Unequal argument depth across sides', 'More than three points per side'],
    whenNotToUse: ['You only have one-sided conviction', 'The topic is purely factual with no debate'],
  },
  21: {
    bestUseCases: ['Viral ranking content', 'Community-friendly S/A/B/C/D sorting exercises'],
    antiPatterns: ['No explicit criteria for tier placement', 'Inconsistent scoring logic across rows'],
    whenNotToUse: ['You need granular numeric comparison', 'The audience needs long-form rationale per item'],
  },
  25: {
    bestUseCases: ['Hack/exploit retrospectives', 'Incident reports with timeline and lessons learned'],
    antiPatterns: ['Speculation without evidence', 'Skipping recovery and remediation details'],
    whenNotToUse: ['The incident is still unfolding', 'You only want a short alert-style update'],
  },
  42: {
    bestUseCases: ['Long-form macro theses', 'Editorial pieces with a single dominant argument'],
    antiPatterns: ['Fragmenting into too many mini sections', 'Using headlines without substantive body content'],
    whenNotToUse: ['You need compact social-first skimmability', 'The argument can be made in a simple chart/table'],
  },
  49: {
    bestUseCases: ['Cost/benefit breakdowns of user flows', 'Shareable post-trade or post-journey receipts'],
    antiPatterns: ['Hiding fees/slippage assumptions', 'Mixing benefit and risk labels inconsistently'],
    whenNotToUse: ['You need comparative multi-protocol analysis', 'The journey is hypothetical and untested'],
  },
  50: {
    bestUseCases: ['Quarterly flagship narratives', 'High-conviction hero stories with magazine treatment'],
    antiPatterns: ['Publishing too frequently', 'Using multiple competing headlines'],
    whenNotToUse: ['You need frequent operational updates', 'You do not have a major milestone to anchor'],
  },
};

export const FRAME_GUIDANCE_BY_ID = Object.freeze(
  Object.fromEntries(
    FRAMES.map((frame) => [
      frame.id,
      {
        ...BASE_GUIDANCE,
        ...(FRAME_GUIDANCE_OVERRIDES[frame.id] || {}),
      },
    ]),
  ),
);
