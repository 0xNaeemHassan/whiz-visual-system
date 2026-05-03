import { describe, it, expect } from 'vitest';
import { detectDuplicatePublication } from './duplicateDetectorService.js';

const NOW = '2026-05-03T12:00:00.000Z';

const baseDraft = {
  frameId: 7,
  layoutId: 'core-2col',
  overrides: { title: { fontSize: 52 }, body: { fontSize: 15 } },
  content: { topicTag: 'Stablecoin Risk', title: 'USDT depeg watch', deck: 'Weekend update', body: 'Liquidity stress and peg pressure.' },
};

describe('detectDuplicatePublication', () => {
  it('flags exact duplicate in recent window as blocking', () => {
    const result = detectDuplicatePublication({
      draft: baseDraft,
      now: NOW,
      recentPublications: [{ ...baseDraft, id: 'pub-1', publishedAt: '2026-05-02T10:00:00.000Z' }],
    });

    expect(result.duplicate?.severity).toBe('blocking');
    expect(result.duplicate?.similarity).toBe(1);
  });

  it('flags near-duplicate with layout reuse as warning', () => {
    const result = detectDuplicatePublication({
      draft: baseDraft,
      now: NOW,
      recentPublications: [{
        id: 'pub-2',
        publishedAt: '2026-05-02T10:00:00.000Z',
        frameId: 7,
        layoutId: 'core-2col',
        overrides: { title: { fontSize: 52 }, body: { fontSize: 15 } },
        content: { topicTag: 'Stablecoin Risk', title: 'USDT depeg alert', deck: 'Weekend brief', body: 'Liquidity pressure and peg stress signals.' },
      }],
    });

    expect(result.duplicate?.severity).toBe('warning');
    expect(result.duplicate?.similarity).toBeGreaterThanOrEqual(0.6);
  });

  it('allows acceptable reuse outside publication window', () => {
    const result = detectDuplicatePublication({
      draft: baseDraft,
      now: NOW,
      windowDays: 7,
      recentPublications: [{ ...baseDraft, id: 'pub-3', publishedAt: '2026-04-01T10:00:00.000Z' }],
    });

    expect(result.duplicate).toBeNull();
  });


});
