import { describe, it, expect } from 'vitest';
import fixtures from '../../../fixtures/benchmarks/frame-recommendation-fixtures.json';
import { FRAMES } from '../../data/frames';
import { rankRecommendedFrames } from './frameRecommendationService';

describe('frameRecommendationService deterministic ranking', () => {
  fixtures.cases.forEach((fx) => {
    it(fx.name, () => {
      const result = rankRecommendedFrames({ frames: FRAMES, ...fx.input });
      expect(result.recommendations.map((entry) => entry.frame.id)).toEqual(fx.expectedTopFrameIds);
    });
  });
});
